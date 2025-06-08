import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { authenticatedGet, authenticatedPost } from '@/utils/authenticatedFetch';
import { buildApiUrl } from '@/utils/apiConfig';

interface PayPalSubscriptionButtonProps {
  planId: string;
  providerPlanId: string;
  onSuccess?: () => void;
  disabled?: boolean;
}

declare global {
  interface Window {
    paypal?: any;
  }
}

const PayPalSubscriptionButton: React.FC<PayPalSubscriptionButtonProps> = ({
  planId,
  providerPlanId,
  onSuccess,
  disabled = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (disabled) return;
    
    loadPayPalSDK();
  }, [disabled, providerPlanId]);

  const loadPayPalSDK = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get PayPal SDK URL from backend with plan_id
      const response = await authenticatedGet(buildApiUrl(`/api/v1/paypal/subscribe/url?plan_id=${planId}`));
      const data = await response.json();

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error('Cannot subscribe to free plan via PayPal. Please use the regular subscription method.');
        }
        throw new Error(data.detail || 'Failed to get PayPal configuration');
      }

      // Load PayPal SDK script
      await loadScript(data.sdk_url);
      
      // Wait for container to be ready and initialize PayPal button
      setTimeout(() => {
        initializePayPalButton();
      }, 100);
      
    } catch (error: any) {
      console.error('Error loading PayPal SDK:', error);
      setError(error.message || 'Failed to load PayPal');
      toast({
        title: "PayPal Error",
        description: "Failed to load PayPal payment system. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Check if PayPal is already loaded
      if (window.paypal) {
        console.log('PayPal SDK already loaded');
        resolve();
        return;
      }

      // Check if script already exists
      const existingScript = document.querySelector(`script[src="${src}"]`);
      if (existingScript) {
        console.log('PayPal script already exists, waiting for load');
        existingScript.addEventListener('load', () => resolve());
        existingScript.addEventListener('error', () => reject(new Error('Failed to load PayPal script')));
        return;
      }

      console.log('Loading PayPal script:', src);
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => {
        console.log('PayPal script loaded successfully');
        // Wait a bit for PayPal to initialize
        setTimeout(resolve, 100);
      };
      script.onerror = () => reject(new Error('Failed to load PayPal script'));
      document.head.appendChild(script);
    });
  };

  const initializePayPalButton = () => {
    console.log('Initializing PayPal button...');
    console.log('window.paypal:', !!window.paypal);
    console.log('containerRef.current:', !!containerRef.current);
    
    if (!window.paypal) {
      console.error('PayPal SDK not loaded');
      setError('PayPal SDK not loaded');
      return;
    }
    
    // Try multiple times to find the container
    let attempts = 0;
    const maxAttempts = 10;
    
    const tryInitialize = () => {
      attempts++;
      console.log(`Attempt ${attempts} to find container`);
      
      if (!containerRef.current) {
        if (attempts < maxAttempts) {
          console.log('Container not ready, retrying in 50ms...');
          setTimeout(tryInitialize, 50);
          return;
        } else {
          console.error('PayPal container not found after max attempts');
          setError('PayPal container not found');
          return;
        }
      }

      // Clear any existing buttons
      containerRef.current.innerHTML = '';
      console.log('Creating PayPal button with plan ID:', providerPlanId);

      // Continue with button creation
      createPayPalButton();
    };

    tryInitialize();
  };

  const createPayPalButton = () => {
    window.paypal.Buttons({
      style: {
        shape: 'pill',
        color: 'gold',
        layout: 'vertical',
        label: 'subscribe'
      },
      createSubscription: function(data: any, actions: any) {
        console.log('Creating subscription with plan ID:', providerPlanId);
        return actions.subscription.create({
          plan_id: providerPlanId
        });
      },
      onApprove: async function(data: any, actions: any) {
        console.log('PayPal subscription approved:', data);
        
        try {
          // Verify subscription with our backend
          const response = await authenticatedPost(buildApiUrl('/api/v1/paypal/subscription/verify'), {
            subscription_id: data.subscriptionID,
            plan_id: planId
          });

          if (response.ok) {
            const result = await response.json();
            toast({
              title: "Success!",
              description: result.message || "Subscription activated successfully!",
            });
            onSuccess?.();
          } else {
            const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
            throw new Error(errorData.detail || 'Failed to verify subscription');
          }
        } catch (error: any) {
          console.error('Error verifying subscription:', error);
          toast({
            title: "Verification Failed",
            description: error.message || "Failed to verify your subscription. Please contact support.",
            variant: "destructive",
          });
        }
      },
      onError: function(err: any) {
        console.error('PayPal subscription error:', err);
        toast({
          title: "Payment Error",
          description: "There was an error processing your payment. Please try again.",
          variant: "destructive",
        });
      },
      onCancel: function() {
        console.log('PayPal subscription cancelled by user');
        toast({
          title: "Payment Cancelled",
          description: "You cancelled the payment process.",
        });
      }
    }).render(containerRef.current);
  };

  if (disabled) {
    return (
      <div className="w-full py-3 px-6 rounded-xl bg-gray-100 text-gray-500 border border-gray-300 text-center">
        PayPal Payment Unavailable
      </div>
    );
  }

  if (loading) {
    return (
      <div className="w-full py-3 px-6 rounded-xl bg-gray-100 text-gray-600 border border-gray-300 text-center">
        Loading PayPal...
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full py-3 px-6 rounded-xl bg-red-50 text-red-600 border border-red-300 text-center">
        PayPal Error: {error}
      </div>
    );
  }

  return (
    <div 
      ref={containerRef} 
      className="w-full"
      style={{ minHeight: '50px' }}
    />
  );
};

export default PayPalSubscriptionButton;