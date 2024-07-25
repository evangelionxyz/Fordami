import "../styles/CircularPercentage.css"

interface Props {
    color: string;
    txtColor: string;
    bgColor: string;
    percentage: number;
    children: string;
};

export const CircularPercentage = ({ color, txtColor, bgColor, percentage, children }: Props) => {
    return (
        <div
            className="percentage"
            style={{
                background: `conic-gradient(${color} ${percentage}%, #ccc 0)`,
                margin: "0px"
            }}
        >
            <div className="percentage-bg" style={{ background: bgColor }}>
                <div className="bbm-text" style={{ color: txtColor }}>
                    <p style={{ margin: "0px" }}>{children}<br></br>{percentage}%</p>
                </div>
            </div>
        </div>
    );
}
