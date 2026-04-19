'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { login } from '@/app/actions/auth';
import { useRouter } from '@/i18n/routing';

interface LoginFormProps {
  translations: {
    apiKey: string;
    submit: string;
    error: string;
  };
}

export function LoginForm({ translations }: LoginFormProps) {
  const [apiKey, setApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(apiKey);
      if (result.success && result.redirect) {
        router.push(result.redirect as any);
      } else {
        setError(translations.error);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="shadow-xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="password"
          label={translations.apiKey}
          placeholder="••••••••••••••••"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          error={error}
          disabled={isLoading}
          required
        />
        <Button 
          type="submit" 
          className="w-full h-11 text-lg" 
          isLoading={isLoading}
        >
          {translations.submit}
        </Button>
      </form>
    </Card>
  );
}
