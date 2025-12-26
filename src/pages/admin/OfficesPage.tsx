import {Building2, Edit, Eye, Trash2, CheckCircle, XCircle} from "lucide-react";
import AdminPageHeader from "../../components/admin/AdminPageHeader.tsx";
import {useOutletContext} from "react-router-dom";
import {format} from "date-fns";
import {fr} from "date-fns/locale";
import {UseGetOpenOffices} from "../../services";

const OfficesPage = () => {
    const {theme} = useOutletContext<{ theme: 'dark' | 'light' }>();
    const isDark = theme === 'dark';

    const {isLoading: isGettingOffices, isRefetching: isReGettingOffices, data: offices, refetch: reGetOffices} = UseGetOpenOffices()

    const handleToggleVisibility = (item: any) => {
        console.log(item)
    }
    const onSelectItem = (item: any) => {
        console.log(item)
    }

    const onEdit = (item: any) => {
        console.log(item)
    }

    const onDelete = (item: any) => {
        console.log(item)
    }


    return (
        <div>
            <AdminPageHeader
                title="Gestion des Bureaux"
                Icon={<Building2 className={`w-7 h-7 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}/>}
                //onExport={handleExportToExcel}
                onRefresh={reGetOffices}
            />

            {
                isGettingOffices || isReGettingOffices ? (
                    <div className="flex items-center justify-center min-h-screen">
                        <div
                            className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                    </div>
                ) : null
            }

            <div
                className={`rounded-lg shadow overflow-hidden border ${
                    isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                }`}
            >
                <table className="w-full">
                    <thead className={isDark ? 'bg-gray-700' : 'bg-gray-100'}>
                    <tr>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Ville
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Adresse
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Crée le
                        </th>
                        <th
                            className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            HQ
                        </th>
                        <th
                            className={`px-6 py-3 text-center text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Visible
                        </th>
                        <th
                            className={`px-6 py-3 text-right text-xs font-medium uppercase tracking-wider ${
                                isDark ? 'text-gray-300' : 'text-gray-600'
                            }`}
                        >
                            Actions
                        </th>
                    </tr>
                    </thead>
                    <tbody className={isDark ? 'divide-y divide-gray-700' : 'divide-y divide-gray-100'}>
                    {offices?.responseData?.data.map((item: any) => (
                        <tr
                            key={item.id}
                            className={`${
                                isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                            } ${!item.is_visible ? (isDark ? 'bg-red-900/10' : 'bg-red-50') : ''}`}
                        >
                            <td className="px-6 py-4">
                                <div
                                    className={`text-sm font-medium ${
                                        isDark ? 'text-white' : 'text-gray-900'
                                    }`}
                                >
                                    {item.title}
                                </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                <div
                                    className={`text-sm ${
                                        isDark ? 'text-gray-300' : 'text-gray-600'
                                    }`}
                                >
                                    {item.address_line_1} <br/>
                                    {item.address_line_2} <br/>
                                    {item.address_line_3}
                                </div>
                            </td>
                            <td
                                className={`px-6 py-4 whitespace-nowrap text-sm ${
                                    isDark ? 'text-gray-300' : 'text-gray-600'
                                }`}
                            >
                                {format(new Date(item.created_at), 'dd/MM/yyyy HH:mm', {locale: fr})}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                                {item?.is_hq?.toString() === "1" ? <CheckCircle className="text-green-700"/> :
                                    <XCircle className="text-red-600"/>}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                <button
                                    onClick={() => handleToggleVisibility(item)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                        item.is_visible ? 'bg-primary-600' : 'bg-gray-600'
                                    }`}
                                >
                    <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            item.is_visible ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                                </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <div className="flex items-center justify-end gap-2">
                                    <button
                                        onClick={() => onSelectItem(item)}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-blue-500/40 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:border-blue-500/60'
                                                : 'border-blue-200 bg-blue-50 text-blue-600 hover:bg-blue-100'
                                        }`}
                                        title="Voir détails"
                                    >
                                        <Eye className="w-5 h-5"/>
                                    </button>
                                    <button
                                        onClick={() => onEdit(item)}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-green-500/40 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:border-green-500/60'
                                                : 'border-green-200 bg-green-50 text-green-600 hover:bg-green-100'
                                        }`}
                                        title="Modifier"
                                    >
                                        <Edit className="w-5 h-5"/>
                                    </button>
                                    <button
                                        onClick={() => onDelete(item)}
                                        className={`inline-flex items-center justify-center w-9 h-9 rounded-lg transition border ${
                                            isDark
                                                ? 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:border-red-500/60'
                                                : 'border-red-200 bg-red-50 text-red-600 hover:bg-red-100'
                                        }`}
                                        title="Supprimer"
                                    >
                                        <Trash2 className="w-5 h-5"/>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

export default OfficesPage