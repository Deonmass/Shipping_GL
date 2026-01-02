import {Download, Plus, RefreshCw} from "lucide-react";
import {useOutletContext} from "react-router-dom";
import {ReactNode} from "react";

type PropsType = {
    title: string,
    Icon?: ReactNode
    onExport?: () => void
    onRefresh?: () => void
    onAdd?: () => void
}

const AdminPageHeader = (props: PropsType) => {
    const { theme } = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';
    const {onExport, onRefresh, onAdd, title, Icon} = props

    return (
        <div className="mb-6 mt-[60px] flex items-center justify-between">
            <h1
                className={`text-2xl font-bold flex items-center gap-3 ${
                    isDark ? 'text-white' : 'text-gray-900'
                }`}
            >
                {Icon}
                {title}
            </h1>
            <div className="flex items-center space-x-3">
                {onExport ? <button
                    onClick={onExport}
                    className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium shadow-sm ${
                        isDark
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                >
                    <Download className="w-4 h-4 mr-2"/>
                    Exporter Excel
                </button> :  null}
                {onRefresh ? <button
                    onClick={onRefresh}
                    className={`px-4 py-2 rounded-lg flex items-center text-sm font-medium border transition-colors ${
                        isDark
                            ? 'bg-gray-700 border-gray-600 text-white hover:bg-gray-600'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
                >
                    <RefreshCw className="w-4 h-4 mr-2"/>
                    Actualiser
                </button> : null}

                {onAdd ? <button
                    onClick={onAdd}
                    className="px-4 py-2 rounded-lg flex items-center text-sm font-medium bg-primary-600 hover:bg-primary-700 text-white"
                >
                    <Plus className="w-5 h-5 mr-2"/> Nouvel enregistrement
                </button> : null}
            </div>
        </div>
    )
}

export default AdminPageHeader;