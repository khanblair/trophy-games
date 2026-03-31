'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Cpu, AlertCircle } from 'lucide-react';
import { AI_MODELS, AIModel } from '@/app/constants/models';
import { cn } from '@/lib/utils';

interface ModelSelectorProps {
    selectedModel: AIModel;
    onModelChange: (model: AIModel) => void;
    disabled?: boolean;
    error?: string;
}

export function ModelSelector({ selectedModel, onModelChange, disabled, error }: ModelSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => setIsOpen(false);
        if (isOpen) {
            document.addEventListener('click', handleClickOutside);
            return () => document.removeEventListener('click', handleClickOutside);
        }
    }, [isOpen]);

    return (
        <div className="relative">
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
                AI Model
            </label>
            <button
                type="button"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                disabled={disabled}
                className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-left transition-colors",
                    error 
                        ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-900/20" 
                        : "border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-600",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <div className="flex items-center gap-2 min-w-0">
                    <Cpu size={14} className={cn(
                        "shrink-0",
                        error ? "text-red-500" : "text-zinc-400"
                    )} />
                    <div className="min-w-0">
                        <p className={cn(
                            "text-sm font-medium truncate",
                            error ? "text-red-700 dark:text-red-400" : "text-zinc-900 dark:text-zinc-100"
                        )}>
                            {selectedModel.name}
                        </p>
                        <p className="text-xs text-zinc-500 truncate">
                            {selectedModel.provider}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    {error && <AlertCircle size={14} className="text-red-500" />}
                    {selectedModel.recommended && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium dark:bg-green-900/30 dark:text-green-400">
                            Recommended
                        </span>
                    )}
                    <ChevronDown size={16} className={cn(
                        "text-zinc-400 transition-transform",
                        isOpen && "rotate-180"
                    )} />
                </div>
            </button>

            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-lg shadow-lg max-h-72 overflow-auto">
                    <div className="p-2 space-y-1">
                        {AI_MODELS.map((model) => (
                            <button
                                key={model.id}
                                type="button"
                                onClick={() => {
                                    onModelChange(model);
                                    setIsOpen(false);
                                }}
                                className={cn(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors",
                                    selectedModel.id === model.id
                                        ? "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                                        : "hover:bg-zinc-50 dark:hover:bg-zinc-700/50"
                                )}
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                                            {model.name}
                                        </p>
                                        {model.recommended && (
                                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-100 text-green-700 font-medium dark:bg-green-900/30 dark:text-green-400">
                                                Recommended
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-500">
                                        {model.provider} • {model.description}
                                    </p>
                                </div>
                                {selectedModel.id === model.id && (
                                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
