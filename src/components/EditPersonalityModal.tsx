'use client';

import { useState, useEffect } from 'react';
import { PersonaConfig, getPersonaAttributes } from '@/lib/types';

interface EditPersonalityModalProps {
  config: PersonaConfig;
  onSave: (config: PersonaConfig) => void;
  onClose: () => void;
}

export default function EditPersonalityModal({ config, onSave, onClose }: EditPersonalityModalProps) {
  const [traits, setTraits] = useState<Record<string, number>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const attrs = getPersonaAttributes(config.track || 'professional');
    const initial: Record<string, number> = {};
    attrs.forEach((a) => {
      initial[a.key] = (config[a.key as keyof PersonaConfig] as number) ?? 5;
    });
    setTraits(initial);
  }, [config]);

  const handleSliderChange = (key: string, value: number) => {
    setTraits((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    const updated: PersonaConfig = {
      ...config,
      ...traits,
    };
    onSave(updated);
    setSaving(false);
    onClose();
  };

  const attributes = getPersonaAttributes(config.track || 'professional');

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-6 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">Edit personality</h2>
            <p className="text-sm text-slate-500 mt-0.5">
              Adjust how {config.name} behaves. Changes apply immediately.
            </p>
          </div>
          <div className="p-6 space-y-4">
            {attributes.map((attr) => {
              const value = traits[attr.key] ?? 5;
              const traitName = attr.traitNames?.[value] ?? String(value);
              return (
                <div key={attr.key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">{attr.label}</span>
                    <span className="text-xs font-medium text-brand-700 bg-brand-50 px-2 py-0.5 rounded">
                      {traitName}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={10}
                    step={1}
                    value={value}
                    onChange={(e) => handleSliderChange(attr.key, Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              );
            })}
          </div>
          <div className="p-6 border-t border-slate-100 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-600 border border-slate-200 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-gradient-brand hover:bg-gradient-brand-hover disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save & continue'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
