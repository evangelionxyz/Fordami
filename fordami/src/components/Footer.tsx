import "../styles/Footer.css";

export const Footer = () => {
    return (
        <div id="footer">
            <label>
                &copy; {new Date().getFullYear()} FORDAMI
            </label>
        </div>
    );
};
