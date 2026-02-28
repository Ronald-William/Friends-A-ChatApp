import { useMemo } from 'react';

const getPasswordStrength = (password) => {
  if (!password) return 0;

  let strength = 0;

  // Length
  if (password.length >= 8) strength++;
  if (password.length >= 12) strength++;

  // Character variety
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
  if (/[0-9]/.test(password)) strength++;
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength++;

  return Math.min(strength, 4);
};


const getPasswordErrors = (password) => {
  if (!password) return [];

  const errors = [];

  if (password.length < 8) {
    errors.push('At least 8 characters');
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('One uppercase letter');
  }
  if (!/[a-z]/.test(password)) {
    errors.push('One lowercase letter');
  }
  if (!/[0-9]/.test(password)) {
    errors.push('One number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('One special character');
  }

  return errors;
};

export default function PasswordStrengthIndicator({ password, showRequirements = true }) {
  const strength = useMemo(() => getPasswordStrength(password), [password]);
  const errors = useMemo(() => getPasswordErrors(password), [password]);

  const strengthConfig = {
    0: { label: 'Very Weak', color: 'bg-red-600', textColor: 'text-red-600' },
    1: { label: 'Weak', color: 'bg-orange-600', textColor: 'text-orange-600' },
    2: { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-500' },
    3: { label: 'Good', color: 'bg-blue-500', textColor: 'text-blue-500' },
    4: { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-500' }
  };

  const config = strengthConfig[strength];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-2">
      {/* Strength bars */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all ${
              level <= strength ? config.color : 'bg-zinc-700'
            }`}
          />
        ))}
      </div>

      {/* Strength label */}
      <div className={`text-xs font-medium ${config.textColor}`}>
        Password strength: {config.label}
      </div>

      {/* Requirements checklist */}
      {showRequirements && errors.length > 0 && (
        <div className="text-xs space-y-1">
          <div className="text-zinc-400">Password must contain:</div>
          {errors.map((error, index) => (
            <div key={index} className="text-red-400 flex items-center gap-1">
              <span>✗</span>
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Success message */}
      {showRequirements && errors.length === 0 && password.length >= 8 && (
        <div className="text-xs text-green-400 flex items-center gap-1">
          <span>✓</span>
          <span>All requirements met!</span>
        </div>
      )}
    </div>
  );
}