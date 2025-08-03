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

interface DeleteAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const DeleteAccountDialog: React.FC<DeleteAccountDialogProps> = ({
  open,
  onOpenChange,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { toast } = useToast();
  const { setCurrentMissionId } = useMissionContext();

  const isConfirmValid = confirmText === 'DELETE';
  const canDelete = isConfirmValid;

  const handleDeleteAccount = async () => {
    if (!canDelete) return;

    setIsLoading(true);
    try {
      const { deleteUserAccount } = await import('../../../utils/authApi');
      await deleteUserAccount();
      
      // Clear current mission ID
      setCurrentMissionId(null);
      
      // Close the popup
      onOpenChange(false);
      
      toast({
        title: "Account Deleted",
        description: "Your account is deleted, you are welcome back again",
        duration: 3000,
      });

      // Wait a moment for toast to show, then logout and navigate
      setTimeout(async () => {
        await logout();
        navigate('/');
      }, 1000);
      
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
      onOpenChange(false);
    }
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
            This action cannot be undone. This will permanently delete your account and all associated data.
          </DialogDescription>
        </DialogHeader>

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
            onClick={handleDeleteAccount}
            disabled={!canDelete || isLoading}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Account
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};