import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ESP Expert:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0e14] text-slate-100 flex items-center justify-center p-4 font-sans">
          <div className="max-w-md w-full bg-[#111722] border border-red-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Ошибка инициализации приложения</h2>
              <p className="text-xs text-slate-400 mt-1">
                Произошел сбой при загрузке расчетного модуля.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-[#0b0e14] p-3 rounded-lg border border-[#243044] text-left">
                <p className="text-[11px] font-mono text-red-300 break-all">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Перезагрузить и сбросить кэш</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
