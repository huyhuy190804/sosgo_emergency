const Pagination = ({
    currentPage = 1,
    totalPages = 1,
    onPageChange,
  }) => {
    const safeTotalPages = Math.max(1, totalPages || 1);
    const pages = Array.from(
      { length: Math.min(3, safeTotalPages) },
      (_, index) => index + 1
    );

    return (
      <div className="mt-4 flex items-center justify-between rounded-xl border bg-white p-3 shadow-sm sm:border-0 sm:bg-transparent sm:p-0 sm:shadow-none">
  
        <button
          className="rounded-lg border px-3 py-2 text-sm font-medium text-gray-500 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => onPageChange?.(currentPage - 1)}
          disabled={currentPage === 1}
        >
          ← Trước
        </button>
  
        <div className="hidden items-center gap-2 sm:flex">
          {pages.map((page) => (
            <button
              key={page}
              onClick={() => onPageChange?.(page)}
              className={`h-8 w-8 text-sm ${
                page === currentPage
                  ? "rounded bg-blue-600 text-white"
                  : ""
              }`}
            >
              {page}
            </button>
          ))}
          {safeTotalPages > 3 && (
            <>
              <span>...</span>
              <button
                onClick={() => onPageChange?.(safeTotalPages)}
                className="text-sm"
              >
                {safeTotalPages}
              </button>
            </>
          )}
        </div>

        <div className="text-sm font-semibold text-gray-900 sm:hidden">
          {currentPage} / {safeTotalPages}
        </div>
  
        <button
          className="rounded-lg border px-3 py-2 text-sm font-medium text-blue-600 disabled:cursor-not-allowed disabled:text-gray-400 disabled:opacity-50"
          onClick={() => onPageChange?.(currentPage + 1)}
          disabled={currentPage === safeTotalPages}
        >
          Tiếp →
        </button>
  
      </div>
    );
  };
  
  export default Pagination;
