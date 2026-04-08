"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import ErrorState from "@/components/shared/ErrorState";

type ErrorBoundaryProps = {
  children: ReactNode;
  title?: string;
  message?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _errorInfo: ErrorInfo) {}

  handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <ErrorState
          title={this.props.title || "Xəta baş verdi"}
          message={this.props.message || "Zəhmət olmasa yenidən cəhd edin."}
          onRetry={this.handleRetry}
          retryText="Yenidən cəhd et"
        />
      );
    }

    return this.props.children;
  }
}
