import React, { useState, useEffect } from 'react';
import { CreditCard, ArrowRight, X, Loader2, Check, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet, authenticatedPost } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';
import PayPalSubscriptionButton from '../../PayPalSubscriptionButton';
import CancelSubscriptionDialog from '../../CancelSubscriptionDialog';

interface Plan {
  id: string;
  name: string;
  description: string;
  price_cents: number;
  billing_interval: string;
  features: string[];
  is_active: boolean;
  is_subscriable: boolean;
  provider_plan_id: string | null;
  display_order: number;
}

interface UserSubscription {
  id: string;
  plan: {
    name: string;
    price_cents: number;
    billing_interval: string;
    description: string;
  };
  status: string;
}

const PlansSettings: React.FC = () => {
  const { toast } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingSubscription, setLoadingSubscription] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [subscribing, setSubscribing] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentSubscription();
    fetchPlans();
  }, []);

  const fetchCurrentSubscription = async () => {
    try {
      setLoadingSubscription(true);
      const response = await authenticatedGet(buildApiUrl('/api/v1/users/profile'));
      
      if (response.ok) {
        const data = await response.json();
        // Extract subscription data from the user profile response
        if (data.subscription) {
          const mappedSubscription: UserSubscription = {
            id: data.subscription.id,
            plan: {
              name: data.subscription.plan.name,
              price_cents: data.subscription.plan.price_cents,
              billing_interval: data.subscription.plan.billing_interval,
              description: data.subscription.plan.description,
            },
            status: data.subscription.status,
          };
          setCurrentSubscription(mappedSubscription);
        } else {
          // No active subscription
          setCurrentSubscription(null);
        }
      } else {
        throw new Error('Failed to fetch user profile');
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setCurrentSubscription(null);
    } finally {
      setLoadingSubscription(false);
    }
  };

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const response = await authenticatedGet(buildApiUrl('/api/v1/plans/?active_only=true'));
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoadingPlans(false);
    }
  };

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return 'Free';
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const handleSubscribe = async (planId: string, planName: string) => {
    try {
      setSubscribing(planId);
      
      const response = await authenticatedPost(buildApiUrl('/api/v1/plans/subscribe'), {
        plan_id: planId,
      });

      if (response.ok) {
        toast({
          title: "Success!",
          description: `Successfully subscribed to ${planName} plan.`,
        });
        fetchCurrentSubscription(); // Refresh current subscription
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error occurred' }));
        throw new Error(errorData.detail || 'Subscription failed');
      }
    } catch (error: any) {
      console.error('Error subscribing to plan:', error);
      toast({
        title: "Subscription Failed",
        description: error.message || "Failed to subscribe to plan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubscribing(null);
    }
  };

  const handlePayPalSuccess = () => {
    fetchCurrentSubscription(); // Refresh current subscription
    toast({
      title: "Success!",
      description: "Successfully subscribed to plan.",
    });
  };

  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };

  const handleSubscriptionCancelled = () => {
    setCurrentSubscription(null);
    fetchCurrentSubscription(); // Refresh subscription data
  };

  const isCurrentPlan = (planName: string) => {
    return currentSubscription?.plan.name === planName;
  };

  return (
    <>
      <div className="space-y-8">
        <h3 className="text-lg font-semibold">Subscription</h3>
        
        {/* Current Plan Section */}
        {loadingSubscription ? (
          <div className="p-4 bg-gray-50 rounded-xl border flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-gray-600 mr-2" />
            <span className="text-gray-600">Loading subscription...</span>
          </div>
        ) : currentSubscription ? (
          <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900">Current Plan</h4>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  {currentSubscription.status}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="font-semibold text-gray-900">{currentSubscription.plan.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      {formatPrice(currentSubscription.plan.price_cents)}
                      {currentSubscription.plan.price_cents > 0 && (
                        <span className="text-sm text-gray-500">/{currentSubscription.plan.billing_interval}</span>
                      )}
                    </p>
                  </div>
                </div>
                
                {currentSubscription.plan.name !== "Trial" && (
                  <Button
                    onClick={handleCancelClick}
                    variant="outline"
                    size="sm"
                    className="border-red-300 hover:bg-red-50 text-red-700"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
            <p className="text-sm font-medium text-gray-900">No Active Plan</p>
            <p className="text-xs text-gray-600 mt-1">Choose a plan below to get started</p>
          </div>
        )}

        {/* All Plans Section */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">Available Plans</h4>
          
          {loadingPlans ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              <span className="ml-2 text-gray-600">Loading plans...</span>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.filter(plan => plan.name !== 'Trial').map((plan) => (
                <div
                  key={plan.id}
                  className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                    isCurrentPlan(plan.name)
                      ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50 shadow-md'
                      : plan.name === 'Basic'
                      ? 'border-blue-300 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  {isCurrentPlan(plan.name) && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                        Current Plan
                      </div>
                    </div>
                  )}
                  
                  {!isCurrentPlan(plan.name) && plan.name === 'Basic' && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gradient-to-r from-green-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center whitespace-nowrap">
                        <Star className="h-3 w-3 mr-1" />
                        Most Popular
                      </div>
                    </div>
                  )}
                  
                  <div className="text-center space-y-3 pt-2">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                    
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {formatPrice(plan.price_cents)}
                        {plan.price_cents > 0 && (
                          <span className="text-sm text-gray-500 font-normal">
                            /{plan.billing_interval}
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <ul className="space-y-1 text-xs text-left">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                          <span className="text-gray-700 capitalize">
                            {feature.replace('_', ' ')}
                          </span>
                        </li>
                      ))}
                    </ul>
                    
                    {isCurrentPlan(plan.name) ? (
                      <div className="w-full py-2 px-4 rounded-lg font-medium text-center bg-green-100 text-green-700 border border-green-200">
                        Current Plan
                      </div>
                    ) : plan.is_subscriable ? (
                      plan.provider_plan_id ? (
                        <PayPalSubscriptionButton
                          planId={plan.id}
                          providerPlanId={plan.provider_plan_id}
                          onSuccess={handlePayPalSuccess}
                          disabled={subscribing !== null}
                          compact={true}
                        />
                      ) : (
                        <Button
                          onClick={() => handleSubscribe(plan.id, plan.name)}
                          disabled={subscribing !== null}
                          className="w-full py-2 px-4 rounded-lg font-medium transition-all duration-200 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300"
                          size="sm"
                        >
                          {subscribing === plan.id ? (
                            <>
                              <Loader2 className="h-3 w-3 animate-spin mr-2" />
                              Subscribing...
                            </>
                          ) : (
                            `Subscribe to ${plan.name}`
                          )}
                        </Button>
                      )
                    ) : (
                      <div className="w-full py-2 px-4 rounded-lg font-medium text-center bg-gray-50 text-gray-500 border border-gray-200">
                        Default Plan
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        subscription={currentSubscription}
        onCancelled={handleSubscriptionCancelled}
      />
    </>
  );
};

export default PlansSettings;