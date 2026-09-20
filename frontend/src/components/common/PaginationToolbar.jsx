import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const PaginationToolbar = ({ currentPage, totalPages, totalResults, itemsPerPage, onPageChange }) => {
  if (totalResults === 0) return null;

  const startResult = (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, totalResults);

  return (
    <div className="pagination-toolbar" aria-label="Pagination">
      <span className="pagination-summary">
        Showing <strong>{startResult}&ndash;{endResult}</strong> of <strong>{totalResults}</strong> results
      </span>

      <div className="pagination-controls">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="pagination-button pagination-direction"
            aria-label="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Previous</span>
          </button>

          <div className="pagination-pages" aria-label="Page navigation">
            <button
              type="button"
              aria-current="page"
              aria-label={`Page ${currentPage}`}
              className="pagination-button pagination-page is-current"
            >
              {currentPage}
            </button>
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="pagination-button pagination-direction"
            aria-label="Next page"
          >
            <span>Next</span>
            <ChevronRight className="h-4 w-4" />
          </button>
      </div>
    </div>
  );
};

export default PaginationToolbar;