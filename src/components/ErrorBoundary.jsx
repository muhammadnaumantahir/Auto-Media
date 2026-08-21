import React from "react";

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Auto-Media UI error:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="max-w-xl mx-auto card p-6 mt-8">
        <p className="label">Something went wrong</p>
        <h1 className="font-display text-2xl font-semibold mt-2">This screen could not be rendered</h1>
        <p className="text-muted text-sm mt-3">{this.state.error?.message || "Unexpected application error."}</p>
        <button className="btn-primary mt-5" onClick={() => this.setState({ error: null })}>Try again</button>
      </div>
    );
  }
}
