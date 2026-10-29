import React, { useState } from 'react';
import { ArrowLeft, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

interface EmailLoginFormProps {
  onBack: () => void;
  onSwitchToRegister: () => void;
  onSubmit: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  isLoading?: boolean;
  authError?: string;
}

const EmailLoginForm: React.FC<EmailLoginFormProps> = ({
  onBack,
  onSwitchToRegister,
  onSubmit,
  isLoading = false,
  authError
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setErrors({});
    
    // Validate inputs
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    try {
      await onSubmit(email.trim(), password, rememberMe);
    } catch (error) {
      // Error handling will be done by parent component
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">Sign In</h3>
          <p className="text-sm text-gray-500">Welcome back to Talosy</p>
        </div>
      </div>

      {/* Auth Error Display */}
      {authError && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-600 font-medium">{authError}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className={`pl-10 h-11 ${errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
          </div>
          {errors.email && (
            <p className="text-xs text-red-600">{errors.email}</p>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="password" className="text-sm font-medium text-gray-700">
            Password
          </Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className={`pl-10 pr-10 h-11 ${errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''}`}
              disabled={isLoading}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4 text-gray-400" />
              ) : (
                <Eye className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600">{errors.password}</p>
          )}
        </div>

        {/* Remember Me */}
        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="rememberMe"
            checked={rememberMe}
            onCheckedChange={setRememberMe}
            disabled={isLoading}
          />
          <Label
            htmlFor="rememberMe"
            className="text-sm text-gray-600 cursor-pointer"
          >
            Remember me for 30 days
          </Label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign In'
          )}
        </Button>
      </form>

      {/* Switch to Register */}
      <div className="text-center pt-4 border-t border-gray-100">
        <p className="text-sm text-gray-600">
          New to Talosy?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-700 font-medium transition-colors"
            disabled={isLoading}
          >
            Create an account
          </button>
        </p>
      </div>
    </div>
  );
};

export default EmailLoginForm;