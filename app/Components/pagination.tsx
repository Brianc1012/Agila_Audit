import React, { useState } from 'react';
import '../styles/components/pagination.css'; // Import the CSS file

type PaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
};

const PaginationComponent: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) => {
  const [jumpToPage, setJumpToPage] = useState<number | string>(''); // State for "Go to" input

  // Calculate the range of page numbers to display
  const getPageNumbers = () => {
    const maxVisiblePages = 3; // Limit the number of visible page numbers
    const pages = [];

    const startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  const handleJumpToPage = () => {
    const page = Number(jumpToPage);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageChange(page);
      setJumpToPage('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleJumpToPage();
    }
  };

  return (
    <div className="pagination-container">
      {/* Page Size Dropdown */}
      <div className="pagination-dropdown-container">
        <select
            value={pageSize}
            id="recordsPerPage"
            className="pagination-dropdown"
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
        >
            {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
                {size} /page
            </option>
            ))}
        </select>
      </div>

      {/* ========Previous Button======= */}
      <div className="pagination-button-container">
      <button
        type='button'
        className="pagination-button-prevnext"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <i className="ri-arrow-left-s-line"></i>
      </button>

      {/* ========First Page========= */}
      <button
        type='button'
        className={`pagination-button ${currentPage === 1 ? 'active' : ''}`}
        onClick={() => onPageChange(1)}
      >
        1
      </button>

      {/* Ellipsis Before Visible Pages */}
      {pageNumbers[0] > 2 && <span className="pagination-ellipsis">...</span>}

      {/* Visible Page Numbers */}
      {pageNumbers.map((page) =>
        page !== 1 && page !== totalPages ? (
          <button
            type='button'
            key={page}
            className={`pagination-button ${currentPage === page ? 'active' : ''}`}
            onClick={() => onPageChange(page)}
          >
            {page}
          </button>
        ) : null
      )}

      {/* Ellipsis After Visible Pages */}
      {totalPages > pageNumbers[pageNumbers.length - 1] + 1 && (
        <span className="pagination-ellipsis">...</span>
      )}

      {/* Last Page */}
      {totalPages > 1 && (
        <button
          type='button'
          className={`pagination-button ${currentPage === totalPages ? 'active' : ''}`}
          onClick={() => onPageChange(totalPages)}
        >
          {totalPages}
        </button>
      )}

      {/* =========Next Button========== */}
      <button
        type='button'
        className="pagination-button-prevnext"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <i className="ri-arrow-right-s-line"></i>
      </button>
    </div>

      {/* =======Go To Input====== */}
    <div className="pagination-goto-container">
        <label className="pagination-go-to">
            Go to:
        <input
          type="number"
          value={jumpToPage}
          onChange={(e) => setJumpToPage(e.target.value)}
          onKeyPress={handleKeyPress}
          min="1"
          max={totalPages}
          placeholder="Page #"
          className="pagination-input"
        />
        </label>
        <button className="pagination-go-button" onClick={handleJumpToPage}> Go </button>
    </div>
</div>
      
  );
};

export default PaginationComponent;