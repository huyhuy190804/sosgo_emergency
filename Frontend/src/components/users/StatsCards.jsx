const StatsCards = ({ stats }) => {
    // fallback nếu chưa có data
    const data = stats || [
      { title: "TỔNG CỘNG (DN)", value: "--" },
    { title: "LỰC LƯỢNG", value: "--" },
    { title: "ĐANG HOẠT ĐỘNG", value: "--" },
    { title: "NGƯNG HOẠT ĐỘNG", value: "--" },
    ];
  
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {data.map((item, i) => (
          <div
            key={i}
            className="rounded-xl border bg-white p-4 shadow-sm"
          >
            <p className="min-h-8 text-xs font-medium uppercase leading-4 text-gray-400 sm:min-h-0">
              {item.title}
            </p>
            <h2 className="mt-1 text-2xl font-semibold leading-none text-gray-900 sm:text-xl">
              {item.value}
            </h2>
          </div>
        ))}
      </div>
    );
  };
  

  export default StatsCards;
