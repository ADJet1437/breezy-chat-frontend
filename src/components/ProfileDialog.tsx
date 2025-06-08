import React, { useState, useEffect } from 'react';
import { User, CreditCard, ArrowRight, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';
import SubscriptionDialog from './SubscriptionDialog';
import CancelSubscriptionDialog from './CancelSubscriptionDialog';

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

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ProfileDialog: React.FC<ProfileDialogProps> = ({ open, onOpenChange }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subscriptionDialogOpen, setSubscriptionDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [loadingSubscription, setLoadingSubscription] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCurrentSubscription();
    }
  }, [open]);

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
              max_messages_per_day: data.subscription.plan.max_messages_per_day,
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

  if (!user) return null;

  const getInitials = (email: string, name?: string | null) => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.charAt(0).toUpperCase();
  };

  const formatPrice = (priceCents: number) => {
    if (priceCents === 0) return 'Free';
    return `$${(priceCents / 100).toFixed(2)}`;
  };

  const formatMessages = (maxMessages: number | null) => {
    if (maxMessages === null) return 'Unlimited';
    return `${maxMessages.toLocaleString()}`;
  };

  const handleSubscriptionClick = () => {
    setSubscriptionDialogOpen(true);
    onOpenChange(false); // Close profile dialog
  };

  const handleCancelClick = () => {
    setCancelDialogOpen(true);
  };

  const handleSubscriptionCancelled = () => {
    setCurrentSubscription(null);
    fetchCurrentSubscription(); // Refresh subscription data
  };

  const handleNewSubscription = () => {
    fetchCurrentSubscription(); // Refresh subscription data after new subscription
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md bg-white/95 backdrop-blur-sm border-0 shadow-2xl">
          <DialogHeader className="text-center space-y-4 pb-4">
            <div className="mx-auto">
              <Avatar className="h-20 w-20 mx-auto">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
                <AvatarFallback className="bg-gradient-to-br from-green-500 to-blue-500 text-white text-xl font-medium">
                  {getInitials(user.email, user.name)}
                </AvatarFallback>
              </Avatar>
            </div>
            <DialogTitle className="text-2xl font-semibold text-gray-900">
              Profile
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* User Information */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <User className="h-5 w-5 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Name</p>
                  <p className="text-sm text-gray-600 truncate">
                    {user.name || 'Not set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <CreditCard className="h-5 w-5 text-gray-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  <p className="text-sm text-gray-600 truncate">
                    {user.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Subscription Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription</h3>
              
              {loadingSubscription ? (
                <div className="p-4 bg-gray-50 rounded-xl border flex items-center justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-gray-600 mr-2" />
                  <span className="text-gray-600">Loading subscription...</span>
                </div>
              ) : currentSubscription ? (
                <div className="space-y-4">
                  {/* Current Subscription Card */}
                  <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-gray-900">Current Plan</h4>
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                          {currentSubscription.status}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Plan</p>
                          <p className="font-medium text-gray-900">{currentSubscription.plan.name}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Price</p>
                          <p className="font-medium text-gray-900">
                            {formatPrice(currentSubscription.plan.price_cents)}
                            {currentSubscription.plan.price_cents > 0 && (
                              <span className="text-xs text-gray-500">/{currentSubscription.plan.billing_interval}</span>
                            )}
                          </p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-gray-600">Messages</p>
                          <p className="font-medium text-gray-900">
                            {formatMessages(currentSubscription.plan.max_messages_per_day)} per day
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleSubscriptionClick}
                          variant="outline"
                          className="flex-1 border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg px-4 py-2"
                        >
                          Change Plan
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                        <Button
                          onClick={handleCancelClick}
                          variant="outline"
                          className="flex-1 border-red-300 hover:bg-red-50 text-red-700 rounded-lg px-4 py-2"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">No Active Plan</p>
                      <p className="text-xs text-gray-600 mt-1">
                        Subscribe to a plan to unlock more features
                      </p>
                    </div>
                    <Button
                      onClick={handleSubscriptionClick}
                      className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white rounded-lg px-4 py-2 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                      View Plans
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <SubscriptionDialog 
        open={subscriptionDialogOpen} 
        onOpenChange={setSubscriptionDialogOpen}
        onSubscribed={handleNewSubscription}
      />
      
      <CancelSubscriptionDialog
        open={cancelDialogOpen}
        onOpenChange={setCancelDialogOpen}
        subscription={currentSubscription}
        onCancelled={handleSubscriptionCancelled}
      />
    </>
  );
};

export default ProfileDialog;