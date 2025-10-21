import React from 'react';
import '@app/styles/Components/error.css';

type ErrorDisplayProps = {
  errorCode?: number | string | null;
  onRetry?: () => void;
  onClose?: () => void;
};

const shortDescription = (code?: number | string | null) => {
  const c = typeof code === 'string' && /^\d+/.test(code as string) ? Number(code) : code;
  switch (c) {
    case 400:
      return 'Bad Request';
    case 401:
      return 'Unauthorized';
    case 403:
      return 'Forbidden';
    case 404:
      return 'Page not found';
    case 408:
      return 'Request Timeout';
    case 429:
      return 'Too Many Requests';
    case 500:
      return 'Internal Server Error';
    case 502:
      return 'Bad Gateway';
    case 503:
      return 'Service Unavailable';
    case 'network':
      return 'Network Error';
    default:
      return 'Something went wrong';
  }
};

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorCode, onRetry, onClose }) => {
  if (!errorCode) return null;

  return (
    <div className="errorDisplay" role="alert" aria-live="assertive">
      <div className="errorInner">
        <div className="errorIcon" aria-hidden>
          ⚠️
        </div>
        <div className="errorText">
          <div className="errorTitle">Error {errorCode}</div>
          <div className="errorSubtitle">{shortDescription(errorCode)}</div>
        </div>
        <div className="errorActions">
          {onRetry && (
            <button className="btn retry" onClick={onRetry}>
              Retry
            </button>
          )}
          {onClose && (
            <button className="btn close" onClick={onClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;
