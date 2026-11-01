import { useState, useRef, useEffect } from 'react';
import { authenticatedGet, authenticatedPost } from '../utils/authenticatedFetch';
import { buildApiUrl } from '../utils/apiConfig';
import { Message } from '../types/chat';
import { PaymentRequiredError, handleApiError } from '../utils/errorHandler';
import { MissionPhase } from '../components/MissionProgressIndicator';

/** Where the user stands on credits, as reported at the end of a turn. */
export interface CreditStatus {
  used: number;
  limit: number;
  remaining: number;
  percentage: number;
  plan_name: string;
  reset_date: string;
  /** At or past the warning threshold. The server owns the threshold. */
  warn: boolean;
  /** The next turn will be refused. */
  exhausted: boolean;
}

interface UseMessageStreamingProps {
  missionId?: string;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  setCurrentMissionId: (id: string) => void;
  attachedFileIds: string[];
  setAttachedFileIds: React.Dispatch<React.SetStateAction<string[]>>;
  setAttachedFileDetails: React.Dispatch<React.SetStateAction<any[]>>;
  inputBarRef: React.RefObject<{ focusInput: () => void }>;
}

interface UseMessageStreamingReturn {
  creditStatus: CreditStatus | null;
  isStreaming: boolean;
  missionPhase: MissionPhase;
  executionProgress: number;
  currentStep: string;
  sendMessageToBackend: (message: string, overrideFileIds?: string[]) => Promise<void>;
  showSubscriptionDialog: boolean;
  setShowSubscriptionDialog: React.Dispatch<React.SetStateAction<boolean>>;
  subscriptionMessage: string;
  pendingMessage: string | null;
  setPendingMessage: React.Dispatch<React.SetStateAction<string | null>>;
  deckId: string | null;
  deckRevision: number;
  expectedSlides: number;
  appId: string | null;
  appSlug: string | null;
  appRevision: number;
  appProgress: string | null;
  setDeckId: React.Dispatch<React.SetStateAction<string | null>>;
}

// The tools that change what the app panel shows.
const APP_TOOLS = new Set([
  'design_app',
  'init_frontend',
  'write_file',
  'delete_file',
  'run_command',
  'build_and_publish',
]);

export const useMessageStreaming = (props: UseMessageStreamingProps): UseMessageStreamingReturn => {
  const {
    missionId,
    messages,
    setMessages,
    setCurrentMissionId,
    attachedFileIds,
    setAttachedFileIds,
    setAttachedFileDetails,
    inputBarRef
  } = props;

  const [isStreaming, setIsStreaming] = useState(false);
  const [creditStatus, setCreditStatus] = useState<CreditStatus | null>(null);
  // The mission this hook created, for as long as the router does not know
  // about it. See where it is read, below.
  const sessionMissionId = useRef<string | null>(null);
  const [missionPhase, setMissionPhase] = useState<MissionPhase>('init');
  const [executionProgress, setExecutionProgress] = useState<number>(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [showSubscriptionDialog, setShowSubscriptionDialog] = useState(false);
  const [subscriptionMessage, setSubscriptionMessage] = useState('');
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  // The artifact this conversation is showing. A deck arrives mid-stream and
  // the panel has to open before it finishes, or the user watches a spinner
  // in the chat with nothing beside it.
  const [deckId, setDeckId] = useState<string | null>(null);
  const [deckRevision, setDeckRevision] = useState<number>(0);
  const [expectedSlides, setExpectedSlides] = useState<number>(0);
  const [appId, setAppId] = useState<string | null>(null);
  // The app's own address. Carried because a brand-new conversation
  // has no mission id on the client yet -- the mission is created
  // server-side mid-request -- and without this the panel had nothing
  // to look the app up by and stayed empty for the whole build.
  const [appSlug, setAppSlug] = useState<string | null>(null);
  // Bumped by every app tool that changes what the panel should show.
  const [appRevision, setAppRevision] = useState(0);
  const [appProgress, setAppProgress] = useState<string | null>(null);

  // Reopening a conversation has to find its deck: the stream that created it
  // is long gone, and without this the panel only ever appears in the session
  // that built it.
  //
  // Keyed on the route's missionId alone. It used to fall back to the mission
  // in context, which outlives navigation -- so starting a new task fetched
  // the *previous* conversation's deck and showed it beside an empty chat. A
  // conversation created in this session needs no fallback: the stream sets
  // the deck directly, and the URL is corrected to /chat/:id once the
  // conversation exists.
  useEffect(() => {
    // Clear first. Whatever deck is on screen belongs to the conversation we
    // are leaving, and it must not survive into the next one for the length
    // of a fetch.
    setDeckId(null);
    setDeckRevision(0);
    setExpectedSlides(0);
    setAppId(null);
    setAppSlug(null);
    setAppRevision(0);
    setAppProgress(null);
    // Belongs to the conversation being left, exactly like the deck above.
    sessionMissionId.current = null;

    if (!missionId) return;

    // A response for a conversation the user has already left must not land.
    let cancelled = false;

    (async () => {
      try {
        const response = await authenticatedGet(
          buildApiUrl(`/api/v1/decks?mission_id=${missionId}`)
        );
        if (!response.ok || cancelled) return;
        const data = await response.json();
        const newest = (data.decks ?? [])[0];
        if (newest && !cancelled) {
          setDeckId(newest.id);
          setDeckRevision(newest.revision || 1);
          setExpectedSlides(newest.slide_count || 0);
        }
      } catch {
        // A conversation without a deck is the normal case.
      }
    })();

    // The app in this conversation, for the same reason as the deck above:
    // appId and appSlug otherwise exist only for as long as the stream that
    // announced them, so reopening a finished conversation showed the whole
    // build in the transcript and no app to open.
    (async () => {
      try {
        const response = await authenticatedGet(
          buildApiUrl(`/api/v1/apps?mission_id=${missionId}`)
        );
        if (!response.ok || cancelled) return;
        const apps = await response.json();
        const newest = (apps ?? [])[0];
        if (newest && !cancelled) {
          setAppId(newest.app_id);
          setAppSlug(newest.slug);
        }
      } catch {
        // A conversation without an app is the normal case.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [missionId]);


  const sendMessageToBackend = async (message: string, overrideFileIds?: string[]) => {
    // The route's id when there is one, otherwise the mission this hook
    // started. Both are needed: the URL is corrected with replaceState at
    // mission_init, which moves the address bar and nothing else -- the
    // router never learns, so useParams keeps returning undefined for the
    // whole conversation. Reading only the route meant every message after
    // the first arrived with no mission_id, and the backend does what it is
    // told: a brand new mission each time, with no history. On screen the
    // transcript looked continuous, because this component keeps appending
    // to its own array -- but the model was answering the first message of
    // a fresh conversation every time, and said so.
    //
    // A ref rather than the mission in context, which outlives navigation:
    // this one is created by this component and dies with it, so a new chat
    // cannot inherit the previous conversation's id however the user got
    // there.
    const effectiveMissionId = missionId ?? sessionMissionId.current;
    let newMissionId: string | null = null;

    setIsStreaming(true);

    try {
      const requestPayload: any = {
        message: message,
        file_ids: overrideFileIds !== undefined ? overrideFileIds : attachedFileIds
      };

      // Only include mission_id if explicitly provided (for continuing existing mission)
      // If undefined, backend will create a new mission
      if (effectiveMissionId) {
        requestPayload.mission_id = effectiveMissionId;
      }

      const response = await authenticatedPost(buildApiUrl('/api/v1/missions/complete'), requestPayload);
      await handleApiError(response, 'Chat Message');

      const botMessageId = (Date.now() + 1).toString();

      // A turn is a sequence of segments, not one bubble. The agent loop can
      // speak, call a tool, and speak again; with a single id the second
      // stretch of text appended into the bubble already sitting above the
      // tool chip. A tool call closes whatever segment is open, so the next
      // text opens a new one below it -- the same shape a reload renders.
      let segment = 0;
      let openTextId: string | null = null;
      let openThinkingId: string | null = null;
      const seenToolCalls = new Set<string>();

      const closeSegments = () => {
        if (openThinkingId) {
          const id = openThinkingId;
          setMessages(prev => prev.map(m =>
            m.id === id ? { ...m, thinkingStreaming: false } : m
          ));
        }
        openTextId = null;
        openThinkingId = null;
        segment += 1;
      };

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // A turn that ends on reasoning -- a loop guard stopping the
            // agent, say -- would otherwise leave the block spinning forever.
            closeSegments();
            break;
          }

          const chunk = decoder.decode(value);
          buffer += chunk;
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || !jsonStr.startsWith('{')) continue;

                const data = JSON.parse(jsonStr);

                if (data.event_type === 'credits_status') {
                  // Sent once, after the turn finishes and its usage has been
                  // written. The turn in flight is never interrupted, so this
                  // is the only chance to warn before the next long one.
                  setCreditStatus(data.data as CreditStatus);
                } else if (data.event_type === 'mission_init') {
                  newMissionId = data.answer;
                  setCurrentMissionId(data.answer);
                  setMissionPhase('init');

                  // The address bar catches up without the router moving.
                  //
                  // navigate() here would unmount this component and abort
                  // the stream it is reading; navigating at the END instead
                  // threw the finished conversation away and refetched it,
                  // which is the flash at the exact moment the answer
                  // lands. replaceState changes the URL and nothing else:
                  // the transcript on screen is already correct, and a
                  // reload now resolves to the task rather than to /chat.
                  if (!missionId) {
                    window.history.replaceState(null, '', `/chat/${data.answer}`);
                    // The router will not tell us this on the next message.
                    sessionMissionId.current = data.answer;
                  }
                } else if (data.event_type === 'execution_init') {
                  setMissionPhase('execution');
                  setExecutionProgress(10);
                  setCurrentStep('Working on it…');
                } else if (data.event_type === 'tool_call') {
                  const customMessage = data.data.message || `🔧 Using: ${data.data.tool_name || 'unknown tool'}`;
                  setCurrentStep(customMessage);
                  setExecutionProgress(prev => Math.min(prev + 10, 85));

                  // Drop a chip into the transcript as the tool runs, so the
                  // live view matches what a reload will show. Keyed on
                  // tool_call_id and updated in place: a tool reports several
                  // times and should stay one line, not become a list.
                  const callId = data.data.tool_call_id || data.data.tool_name;
                  if (callId) {
                    const chipId = `tool_${callId}`;
                    // Only the first report for this call closes the open
                    // segment; a running tool reports repeatedly and must not
                    // split the text around it each time. Tracked here rather
                    // than inside the updater below, which React runs later.
                    if (!seenToolCalls.has(chipId)) {
                      seenToolCalls.add(chipId);
                      closeSegments();
                    }
                    setMessages(prev => {
                      const existing = prev.find(m => m.id === chipId);
                      // Append rather than replace: the tool reports many
                      // times, and the sequence is the useful part -- a single
                      // changing line shows movement, the list shows what it
                      // actually did. Repeats are dropped so a timed tick that
                      // says the same thing twice does not pad the log.
                      const log = existing?.toolProgress ?? [];
                      const step = data.data.message;
                      const toolProgress =
                        step && step !== log[log.length - 1] ? [...log, step] : log;

                      const chip: Message = {
                        id: chipId,
                        content: '',
                        sender: 'bot',
                        timestamp: existing?.timestamp ?? new Date(),
                        type: 'tool-use',
                        toolName: data.data.tool_name || 'tool',
                        toolSummary: data.data.message,
                        toolFailed: data.data.status === 'error',
                        toolProgress,
                        // Anything but a terminal status means still working.
                        toolRunning: !['error', 'success', 'complete'].includes(
                          data.data.status
                        ),
                      };
                      return existing
                        ? prev.map(m => (m.id === chipId ? chip : m))
                        : [...prev, chip];
                    });
                  }

                } else if (data.event_type === 'tool_start' && data.data?.tool_name === 'image_generation') {
                  const skeletonMessage: Message = {
                    id: botMessageId,
                    content: data.data.message,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'image-generating',
                    prompt: data.data.message.replace('🎨 Generating image: ', '').replace(/\.\.\..*$/, '')
                  };
                  closeSegments();
                  setMessages(prev => [...prev, skeletonMessage]);
                } else if (data.event_type === 'tool_start' && data.data?.tool_name === 'image_editing') {
                  const skeletonMessage: Message = {
                    id: botMessageId,
                    content: data.data.message,
                    sender: 'bot',
                    timestamp: new Date(),
                    type: 'image-editing',
                    prompt: data.data.message.replace('✏️ Editing image: ', '').replace(/\.\.\..*$/, '')
                  };
                  closeSegments();
                  setMessages(prev => [...prev, skeletonMessage]);
                } else if (data.event_type === 'tool_complete' && data.data?.tool_name === 'image_generation') {
                  const result = data.data.result;
                  if (result && result.base64_image) {
                    setMessages(prev => prev.map(msg =>
                      msg.id === botMessageId && msg.type === 'image-generating'
                        ? {
                            ...msg,
                            type: 'image',
                            imageUrl: result.base64_image,
                            imageAlt: result.image_filename,
                            filename: result.image_filename,
                            prompt: result.prompt,
                            isLoaded: true
                          }
                        : msg
                    ));
                  }
                } else if (data.event_type === 'tool_complete' && data.data?.tool_name === 'image_editing') {
                  const result = data.data.result;
                  if (result && result.base64_image) {
                    setMessages(prev => prev.map(msg =>
                      msg.id === botMessageId && msg.type === 'image-editing'
                        ? {
                            ...msg,
                            type: 'image',
                            imageUrl: result.base64_image,
                            imageAlt: result.image_filename,
                            filename: result.image_filename,
                            prompt: result.prompt,
                            isLoaded: true
                          }
                        : msg
                    ));
                  }
                } else if (data.event_type === 'execution_reflection') {
                  const message = data.data.message || 'Processing...';
                  setCurrentStep(`💭 ${message}`);
                  setExecutionProgress(prev => Math.min(prev + 5, 90));
                } else if (data.event_type === 'deck_built') {
                  setCurrentStep(data.data.message || 'Rendering slides…');
                  if (APP_TOOLS.has(data.data.tool_name)) {
                    setAppProgress(data.data.message || null);
                  }
                } else if (data.event_type === 'execution_complete') {
                  if (data.data.app_id) {
                    // design_app and build_and_publish both carry it. The
                    // panel opens on the design, long before anything is
                    // built, so the schema is visible while pages are
                    // written rather than only at the end.
                    setAppId(data.data.app_id);
                    if (data.data.slug) setAppSlug(data.data.slug);
                    setAppRevision(n => n + 1);
                    setAppProgress(null);
                  } else if (APP_TOOLS.has(data.data.tool_name)) {
                    // A file written or a command run changes the project
                    // without naming the app; the panel still wants to know.
                    setAppRevision(n => n + 1);
                  }
                  if (data.data.deck_id) {
                    // modify_deck returns the same deck_id with a higher
                    // revision; the revision is what busts the slide image
                    // cache, so an edit refreshes the panel in place instead
                    // of showing the previous version's pictures.
                    setDeckId(data.data.deck_id);
                    setDeckRevision(data.data.revision || 1);
                    setExpectedSlides(data.data.slide_count || 0);
                  }
                  // Settle every chip: the tool finished, whatever it was.
                  // The closing line joins the log, so the expanded view ends
                  // on the outcome rather than on "Rendering slides…".
                  setMessages(prev => prev.map(m => {
                    if (m.type !== 'tool-use' || !m.toolRunning) return m;
                    const log = m.toolProgress ?? [];
                    const step = data.data.message;
                    return {
                      ...m,
                      toolRunning: false,
                      toolSummary: step || m.toolSummary,
                      toolProgress:
                        step && step !== log[log.length - 1] ? [...log, step] : log,
                    };
                  }));
                  setMissionPhase('complete');
                  setExecutionProgress(100);

                  setCurrentStep('Done');
                } else if (data.event_type === 'mission_thinking') {
                  // One block per segment, appended to in place, so reasoning
                  // sits directly above the thing it produced -- including a
                  // second round of reasoning after a tool returns.
                  const thinkingId = openThinkingId
                    ?? `${botMessageId}_seg${segment}_thinking`;
                  const isNew = openThinkingId === null;
                  openThinkingId = thinkingId;
                  setMessages(prev => {
                    if (!isNew) {
                      return prev.map(m =>
                        m.id === thinkingId
                          ? { ...m, content: m.content + data.answer }
                          : m
                      );
                    }
                    return [...prev, {
                      id: thinkingId,
                      content: data.answer,
                      sender: 'bot' as const,
                      timestamp: new Date(),
                      type: 'thinking' as const,
                      thinkingStreaming: true,
                    }];
                  });
                } else if (data.event_type === 'mission_content') {
                  // Text means the model has stopped reasoning: collapse the
                  // block rather than leaving it open above the answer.
                  if (openThinkingId) {
                    const id = openThinkingId;
                    setMessages(prev => prev.map(m =>
                      m.id === id ? { ...m, thinkingStreaming: false } : m
                    ));
                    openThinkingId = null;
                  }

                  const textId = openTextId ?? `${botMessageId}_seg${segment}_text`;
                  const isNew = openTextId === null;
                  openTextId = textId;
                  setMessages(prev => {
                    if (!isNew) {
                      return prev.map(m =>
                        m.id === textId
                          ? { ...m, content: m.content + data.answer }
                          : m
                      );
                    }
                    return [...prev, {
                      id: textId,
                      content: data.answer,
                      sender: 'bot' as const,
                      timestamp: new Date(),
                    }];
                  });
                }
              } catch (error) {
                console.error('Error parsing SSE data:', error);
              }
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof PaymentRequiredError) {
        // The server says how many credits the plan includes and which plan
        // ran out, so prefer its wording; these are the fallbacks.
        let dialogMessage = error.message;
        if (error.errorCode === 'SUBSCRIPTION_REQUIRED') {
          dialogMessage = 'Please subscribe to continue chatting with our AI assistant.';
        } else if (!dialogMessage) {
          dialogMessage =
            error.errorCode === 'TRIAL_LIMIT_EXCEEDED'
              ? 'You\'ve used all the credits included in the Trial plan. Upgrade to continue.'
              : 'Please upgrade your subscription to continue.';
        }

        setSubscriptionMessage(dialogMessage);
        setPendingMessage(message);
        setShowSubscriptionDialog(true);
        return;
      }

      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        content: "Sorry, I'm having trouble connecting to the server. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsStreaming(false);
      setAttachedFileIds([]);
      setAttachedFileDetails([]);

      // No navigation on completion: the URL was corrected when the task
      // was created, and the messages on screen are the ones a refetch
      // would return.
      inputBarRef.current?.focusInput();
    }
  };

  return {
    creditStatus,
    isStreaming,
    missionPhase,
    executionProgress,
    currentStep,
    sendMessageToBackend,
    showSubscriptionDialog,
    setShowSubscriptionDialog,
    subscriptionMessage,
    pendingMessage,
    setPendingMessage,
    deckId,
    deckRevision,
    expectedSlides,
    appId,
    appSlug,
    appRevision,
    appProgress,
    setDeckId
  };
};
