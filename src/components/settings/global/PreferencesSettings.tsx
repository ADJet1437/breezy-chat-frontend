import React from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useTheme } from '../../../contexts/ThemeContext';

export const PreferencesSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      {/* Theme Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Choose how the interface appears to you
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <Label className="text-sm font-medium">Theme</Label>
            <RadioGroup
              value={theme}
              onValueChange={(value: 'light' | 'dark') => setTheme(value)}
              className="grid grid-cols-2 gap-4"
            >
              <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                <RadioGroupItem value="light" id="light" />
                <div className="flex items-center gap-3 flex-1">
                  <Sun className="h-5 w-5 text-yellow-500" />
                  <div>
                    <Label htmlFor="light" className="cursor-pointer font-medium">
                      Light
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Clean and bright interface
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                <RadioGroupItem value="dark" id="dark" />
                <div className="flex items-center gap-3 flex-1">
                  <Moon className="h-5 w-5 text-blue-400" />
                  <div>
                    <Label htmlFor="dark" className="cursor-pointer font-medium">
                      Dark
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Easy on the eyes in low light
                    </p>
                  </div>
                </div>
              </div>
            </RadioGroup>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};