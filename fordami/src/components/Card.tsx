import { CircularPercentage } from "./CircularPercentage";
import { useVehicles } from "./VehicleContext";
import { getPercentageColor } from "../utils";

import "../styles/Card.css";

interface CardProps {
  index: number;
  selected: boolean;
  onClick?: () => void;
}

const getLightColor = (ready: boolean, selected: boolean) => {
  if (selected) {
    return "#EEEEEE";
  }
  return ready ? "#EEEEEE" : "#222831";
};
const getDarkColor = (ready: boolean, selected: boolean) => {
  if (selected) {
    return "#113263";
  }
  return ready ? "#EEEEEE" : "#a22835";
};

export const Card = ({ index, selected, onClick }: CardProps) => {
  const { vehicles, setVehicles } = useVehicles();
  const vehicle = vehicles[index];

  const percentageColor = getPercentageColor(vehicle.bbm);
  const darkColor = getDarkColor(vehicle.isReady, selected);
  const lightColor = getLightColor(!vehicle.isReady, selected);

  return (
    <>
      <div
        id="card-container"
        onClick={onClick}
        style={{
          background: darkColor,
          border: "2px solid " + lightColor,
        }}
      >
        <div className="row">
          <div
            className="col"
            style={{
              margin: "10px 0px 10px 10px",
              maxWidth: "150px",
              height: "fit-content",
            }}
          >
            <div className="col">
              <img id="card-image" style={{width: "150px", height: "150px"}} src={vehicle.imageUrl}  alt={vehicle.kind+" " + vehicle.number}/>
            </div>
            <div className="col">
              <label className="form-label" style={{ color: lightColor }}>
                {vehicle.kind}
              </label>
            </div>
            <div className="col">
              <label className="form-label" style={{ color: lightColor }}>
                {vehicle.number}
              </label>
            </div>
          </div>

          <div
            className="col"
            style={{ margin: "0px 10px 0px 0px", alignContent: "center" }}
          >
            <CircularPercentage
              color={percentageColor}
              bgColor={darkColor}
              percentage={vehicle.bbm}
              txtColor={lightColor}
            >
              BBM
            </CircularPercentage>
          </div>
        </div>
      </div>
    </>
  );
};
