export const generateSimpleId = (): string => {
    return Math.random().toString(36).substr(2, 9);
}

export const getOrCreateComputerId = (): string => {
    let computerId = localStorage.getItem('computerId');
    if (!computerId) {
        computerId = generateSimpleId();
        localStorage.setItem("computerId", computerId);
    }
    return computerId;
}

export const checkAdminLoginStatus = (): boolean => {
    const loginInfoString = localStorage.getItem("adminLoginInfo");
    if (loginInfoString) {
        const loginInfo = JSON.parse(loginInfoString);
        const currentComputerId = getOrCreateComputerId();
        if (loginInfo.computerId === currentComputerId && loginInfo.expirationTime > Date.now()) {
            return true;
        }
    }
    return false;
}

export const getPercentageColor = (percentage: number) => {
    if (percentage >= 75) return "#28a745";
    if (percentage >= 50) return "#ffc107";
    if (percentage >= 25) return "#fd7e14";
    return "#dc3545";
};

export const getTimestamp = (): string => {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}.${minutes}`;
};
