import React from 'react';
import { User, Mail, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';

const ProfileSettings: React.FC = () => {
  const { user, logout } = useAuth();

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

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
      
      {/* Profile Picture */}
      <div className="flex items-center space-x-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={user.avatar_url || undefined} alt={user.name || user.email} />
          <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white text-lg font-medium">
            {getInitials(user.email, user.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <h4 className="font-medium text-foreground">{user.name || 'User'}</h4>
          <p className="text-sm text-muted-foreground">Profile Picture</p>
        </div>
      </div>

      {/* User Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
          <User className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Name</p>
            <p className="text-sm text-muted-foreground truncate">
              {user.name || 'Not set'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 p-4 bg-muted rounded-xl">
          <Mail className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Email</p>
            <p className="text-sm text-muted-foreground truncate">
              {user.email}
            </p>
          </div>
        </div>
      </div>

      {/* Sign Out Section */}
      <div className="border-t border-border pt-6">
        <Button
          onClick={logout}
          variant="outline"
          className="w-full border-destructive/50 hover:bg-destructive/10 text-destructive rounded-xl px-4 py-3 transition-all duration-200"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default ProfileSettings;