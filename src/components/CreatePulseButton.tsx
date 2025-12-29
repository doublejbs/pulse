interface CreatePulseButtonProps {
  onClick: () => void
}

const CreatePulseButton = ({ onClick }: CreatePulseButtonProps) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 right-6 bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-6 py-3 rounded-full font-medium shadow-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors focus:outline-none focus:ring-4 focus:ring-gray-900/20 dark:focus:ring-white/20 z-50"
    >
      pulse 만들기
    </button>
  )
}

export default CreatePulseButton

