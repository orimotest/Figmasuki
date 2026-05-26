import { Component, type ErrorInfo, type ReactNode } from "react";

type FatalErrorBoundaryProps = {
  children: ReactNode;
};

type FatalErrorBoundaryState = {
  error: Error | null;
};

export class FatalErrorBoundary extends Component<
  FatalErrorBoundaryProps,
  FatalErrorBoundaryState
> {
  state: FatalErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error): FatalErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("AI Cover Studio UI fatal error", error, info.componentStack);
  }

  render(): ReactNode {
    if (!this.state.error) {
      return this.props.children;
    }

    return (
      <main className="fatal-error-screen">
        <section className="fatal-error-card">
          <p className="eyebrow">AI Cover Studio</p>
          <h1>UIの起動中にエラーが発生しました</h1>
          <p>
            プラグインを閉じて、もう一度起動してください。続く場合は、
            manifest.jsonを読み込み直してから確認してください。
          </p>
          <pre>{this.state.error.message}</pre>
        </section>
      </main>
    );
  }
}
