import React, { useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { authenticatedDelete } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';

interface UserSubscription {
  id: string;
  plan: {
    name: string;
    price_cents: number;
    billing_interval: string;
    max_messages_per_day: number | null;
  };
  status: string;
}

interface CancelSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscription: UserSubscription | null;
  onCancelled: () => void;
}

const CancelSubscriptionDialog: React.FC<CancelSubscriptionDialogProps> = ({
  open,
  onOpenChange,
  subscription,
  onCancelled,
}) => {
  const [cancelling, setCancelling] = useState(false);
  const { toast } = useToast();

  if (!subscription) return null;

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return 'Free';
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const formatMessages = (maxMessages: number | null) => {
    if (maxMessages === null) return 'Unlimited';
    return `${maxMessages.toLocaleString()}`;
  };

  const handleCancel = async () => {
    try {
      setCancelling(true);
      
      const response = await authenticatedDelete(buildApiUrl('/api/v1/plans/subscription'));

      if (response.ok) {
        toast({
          title: "Subscription Cancelled",
          description: `Your ${subscription.plan.name} plan has been cancelled successfully.`,
        });
        onCancelled();
        onOpenChange(false);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        
        if (response.status === 404) {
          toast({
            title: "No Active Subscription",
            description: "You don't have an active subscription to cancel.",
            variant: "destructive",
          });
        } else {
          throw new Error(errorData.detail || 'Cancellation failed');
        }
      }
    } catch (error: any) {
      console.error('Error cancelling subscription:', error);
      
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Cancellation Failed",
          description: error.message || "Failed to cancel subscription. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setCancelling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
        <DialogHeader className="text-center space-y-4 pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-gray-900">
            Cancel Subscription
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Current Plan Info */}
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <h3 className="font-semibold text-gray-900 mb-2">You're about to cancel:</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Plan:</span>
                <span className="font-medium text-gray-900">{subscription.plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Price:</span>
                <span className="font-medium text-gray-900">
                  {formatPrice(subscription.plan.price_cents)}
                  {subscription.plan.price_cents > 0 && (
                    <span className="text-sm text-gray-500">/{subscription.plan.billing_interval}</span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Messages:</span>
                <span className="font-medium text-gray-900">
                  {formatMessages(subscription.plan.max_messages_per_day)} per day
                </span>
              </div>
            </div>
          </div>

          {/* Warning Message */}
          <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <h4 className="font-medium text-gray-900 mb-2">⚠️ What happens when you cancel:</h4>
            <ul className="text-sm text-gray-700 space-y-1">
              <li>• You'll lose access to your current plan benefits</li>
              <li>• Your message limit will be reduced to the default free tier</li>
              <li>• You can resubscribe at any time</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={() => onOpenChange(false)}
              variant="outline"
              className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl px-4 py-2"
              disabled={cancelling}
            >
              Keep Plan
            </Button>
            <Button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex-1 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 text-white rounded-xl px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {cancelling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                'Cancel Subscription'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CancelSubscriptionDialog;