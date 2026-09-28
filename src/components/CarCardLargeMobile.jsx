import React from "react";
import styles from "./CarCardLargeMobile.module.css";

const CarCardLargeMobile = ({ image, alt = "car" }) => {
  return (
    <div className={styles.canvas} role="img" aria-label={alt}>
       <img src={image} alt={alt} className={styles.carImage} />
    </div>
  );
};

export default CarCardLargeMobile;


