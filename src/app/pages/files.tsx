import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function Files() {
  return (
    <div className="flex flex-col h-full">
      {/* Header Tabs */}
      <div className="bg-white border-b border-gray-200 px-8 pt-6">
        <div className="flex items-center gap-8">
          <button className="pb-4 text-gray-500 hover:text-gray-900">
            BO
          </button>
          <button className="pb-4 text-gray-500 hover:text-gray-900">
            기업 관리
          </button>
          <button className="pb-4 text-gray-500 hover:text-gray-900">
            영업 이력
          </button>
          <button className="pb-4 border-b-2 border-orange-500 text-gray-900 font-semibold">
            문서
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto bg-[#f5f6fa] p-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-6 rounded-lg overflow-hidden">
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1634586700814-84a73f78d90e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjb25zdHJ1Y3Rpb24lMjB3b3JrJTIwcHJvZ3Jlc3N8ZW58MXx8fHwxNzczNTgxMTEwfDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                alt="추후 개발"
                className="w-full h-64 object-cover"
              />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">추후 개발 예정</h3>
            <p className="text-gray-500">문서 관리 기능은 곧 출시될 예정입니다</p>
          </div>
        </div>
      </div>
    </div>
  );
}