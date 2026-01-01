import Swal from "sweetalert2";

const success = (isDark: boolean, message: string) => {
    Swal.fire({
        icon: 'success',
        title: 'Succès',
        text: message,
        background: isDark ? '#020617' : '#ffffff',
        color: isDark ? '#e5e7eb' : '#111827',
        confirmButtonColor: '#22c55e',
    });
}

const error = (isDark: boolean, message: string) => {
    Swal.fire({
        icon: 'error',
        title: 'Erreur',
        text: message,
        background: isDark ? '#020617' : '#ffffff',
        color: isDark ? '#e5e7eb' : '#111827',
    });
}

export default {
    success,
    error,
}