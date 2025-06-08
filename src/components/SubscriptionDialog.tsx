import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Star, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet, authenticatedPost } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';
import PayPalSubscriptionButton from './PayPalSubscriptionButton';

interface Plan {
  id: string;
  name: string;
  description: string;
  max_messages_per_day: number | null;
  price_cents: number;
  billing_interval: string;
  features: string[];
  is_active: boolean;
  provider_plan_id: string | null;
}

interface SubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubscribed?: () => void;
  message?: string;
}

const SubscriptionDialog: React.FC<SubscriptionDialogProps> = ({ open, onOpenChange, onSubscribed, message }) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      fetchPlans();
    }
  }, [open]);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await authenticatedGet(buildApiUrl('/api/v1/plans/?active_only=true'));
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast({
        title: "Error",
        description: "Failed to load subscription plans. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId: string, planName: string) => {
    try {
      setSubscribing(planId);
      
      const response = await authenticatedPost(buildApiUrl('/api/v1/plans/subscribe'), {
        plan_id: planId,
      });

      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Success!",
          description: `Successfully subscribed to ${planName} plan.`,
        });
        onSubscribed?.(); // Call the callback to refresh subscription data
        onOpenChange(false);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        
        // Handle specific error cases
        if (response.status === 409) {
          toast({
            title: "Already Subscribed",
            description: "You already have an active subscription. Please cancel it first if you want to change plans.",
            variant: "destructive",
          });
        } else if (response.status === 404) {
          toast({
            title: "Plan Not Found",
            description: "The selected plan is no longer available.",
            variant: "destructive",
          });
        } else {
          throw new Error(errorData.detail || 'Subscription failed');
        }
      }
    } catch (error: any) {
      console.error('Error subscribing to plan:', error);
      
      // Network or other errors
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        toast({
          title: "Connection Error",
          description: "Unable to connect to the server. Please check your internet connection and try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Subscription Failed",
          description: error.message || "Failed to subscribe to plan. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setSubscribing(null);
    }
  };

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return 'Free';
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const formatMessages = (maxMessages: number | null) => {
    if (maxMessages === null) return 'Unlimited';
    return `${maxMessages.toLocaleString()} messages`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-blue-500 rounded-full flex items-center justify-center">
            <CreditCard className="h-8 w-8 text-white" />
          </div>
          <DialogTitle className="text-3xl font-bold text-gray-900">
            Choose Your Plan
          </DialogTitle>
          <p className="text-gray-600">
            {message || "Select the perfect plan for your needs. No payment required for now."}
          </p>
        </DialogHeader>
        
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
            <span className="ml-2 text-gray-600">Loading plans...</span>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`relative p-6 rounded-2xl border-2 transition-all duration-200 ${
                  plan.name === 'Basic'
                    ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {plan.name === 'Basic' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium flex items-center">
                      <Star className="h-3 w-3 mr-1" />
                      Most Popular
                    </div>
                  </div>
                )}
                
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-600">{plan.description}</p>
                  
                  <div className="py-4">
                    <div className="text-4xl font-bold text-gray-900">
                      {formatPrice(plan.price_cents)}
                      {plan.price_cents > 0 && (
                        <span className="text-lg text-gray-500 font-normal">
                          /{plan.billing_interval}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatMessages(plan.max_messages_per_day)} per day
                    </p>
                  </div>
                  
                  <ul className="space-y-3 text-left">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                        <span className="text-gray-700 capitalize">
                          {feature.replace('_', ' ')}
                        </span>
                      </li>
                    ))}
                  </ul>
                  
                  {plan.name === 'Basic' && plan.provider_plan_id ? (
                    <PayPalSubscriptionButton
                      planId={plan.id}
                      providerPlanId={plan.provider_plan_id}
                      onSuccess={() => {
                        onSubscribed?.();
                        onOpenChange(false);
                      }}
                      disabled={subscribing !== null}
                    />
                  ) : (
                    <Button
                      onClick={() => handleSubscribe(plan.id, plan.name)}
                      disabled={subscribing !== null}
                      className={`w-full py-3 px-6 rounded-xl font-medium transition-all duration-200 ${
                        plan.name === 'Basic'
                          ? 'bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white shadow-lg hover:shadow-xl'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300'
                      }`}
                    >
                      {subscribing === plan.id ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Subscribing...
                        </>
                      ) : (
                        `Subscribe to ${plan.name}`
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {!loading && plans.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-600">No subscription plans available at the moment.</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionDialog;