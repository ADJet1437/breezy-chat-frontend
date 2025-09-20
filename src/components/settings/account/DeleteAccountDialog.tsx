import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '../../../contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useMissionContext } from '../../../contexts/MissionContext';
import { clearAllCache } from '../../../utils/cacheUtils';

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [showFinalConfirm, setShowFinalConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { setCurrentMissionId } = useMissionContext();

  const isConfirmValid = confirmText === 'DELETE';
  const canDelete = isConfirmValid;

  const handleProceedToFinalConfirm = () => {
    if (!canDelete) return;
    setShowFinalConfirm(true);
  };

  const handleFinalDeleteAccount = async () => {
    setIsLoading(true);
    try {
      // Add animation delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const { deleteUserAccount } = await import('../../../utils/authApi');
      await deleteUserAccount();
      
      // Clear all browser storage after successful deletion
      clearAllCache();
      
      // Clear current mission ID
      setCurrentMissionId(null);
      
      // Close the popup
      onOpenChange(false);

      // Logout and navigate to use-cases immediately without toast
      await logout();
      navigate('/use-cases');
      
    } catch (error) {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : "Failed to delete account. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setConfirmText('');
      setShowFinalConfirm(false);
      onOpenChange(false);
    }
  };

  const handleBackToFirstStep = () => {
    setShowFinalConfirm(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            {!showFinalConfirm && "This action cannot be undone. This will permanently delete your account and all associated data."}
          </DialogDescription>
        </DialogHeader>

        {!showFinalConfirm ? (
          <>
            <div className="space-y-6 py-4">
              {/* Type DELETE Confirmation */}
              <div className="space-y-2">
                <Label htmlFor="confirm-text" className="text-sm font-medium">
                  Type <span className="font-bold text-red-600">DELETE</span> to confirm
                </Label>
                <Input
                  id="confirm-text"
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleProceedToFinalConfirm}
                disabled={!canDelete || isLoading}
                className="flex-1"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Continue
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Final Confirmation Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                onClick={handleBackToFirstStep}
                disabled={isLoading}
                className="flex-1"
              >
                No, Go Back
              </Button>
              <Button
                variant="destructive"
                onClick={handleFinalDeleteAccount}
                disabled={isLoading}
                className="flex-1"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Deleting...
                  </>
                ) : (
                  "Yes, Delete Forever"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};