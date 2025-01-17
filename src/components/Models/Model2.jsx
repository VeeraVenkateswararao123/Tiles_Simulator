import React, { useEffect, useState, useRef } from "react";
import "../Models/styles/model.css";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Bounds } from "@react-three/drei";
import { Box3, Vector3, TextureLoader, RepeatWrapping, Color } from "three";
import * as THREE from "three";
import { tilesData } from "../../data/tiles";
import { Blocks } from "react-loader-spinner"; // Import Audio loader
import { color } from "three/webgpu";

const DynamicMaterialModel = ({
  modelPath,
  materialUpdates,
  onPartSelected,
}) => {
  const { scene } = useGLTF(modelPath);
  const [hoveredPart, setHoveredPart] = useState(null);
  const modelRef = useRef();

  useEffect(() => {
    if (modelRef.current) {
      const boundingBox = new Box3().setFromObject(modelRef.current);
      const size = new Vector3();
      boundingBox.getSize(size);
      console.log("Width:", size.x);
      console.log("Height:", size.y);
      console.log("Depth:", size.z);
    }
    scene.traverse((child) => {
      if (child.isMesh) {
        if (!(child.material instanceof THREE.MeshStandardMaterial)) {
          child.material = new THREE.MeshStandardMaterial({
            color: child.material.color,
            roughness: 0.5,
            metalness: 0.5,
          });
        }
        const update = materialUpdates[child.uuid];
        if (update) {
          if (update.color) {
            child.material.color = new Color(update.color);
          }
          if (update.texture) {
            const texture = new TextureLoader().load(update.texture);
            texture.wrapS = RepeatWrapping;
            texture.wrapT = RepeatWrapping;
            texture.repeat.set(update.tileScaleX || 1, update.tileScaleY || 1);
            child.material.map = texture;
          }
          child.material.needsUpdate = true;
        }
        if (child.uuid === hoveredPart) {
          child.material.emissive = new THREE.Color(0xaaaaaa);
          child.material.emissiveIntensity = 0.5;
        } else {
          child.material.emissive = new THREE.Color(0x000000);
          child.material.emissiveIntensity = 0;
        }
      }
    });
  }, [scene, materialUpdates, hoveredPart]);

  const handlePointerDown = (event) => {
    event.stopPropagation();
    const selectedPart = event.object.uuid;
    const materialName = event.object.material.name;
    onPartSelected(selectedPart, materialName);
  };

  const handlePointerOver = (event) => {
    setHoveredPart(event.object.uuid);
  };

  const handlePointerOut = () => {
    setHoveredPart(null);
  };

  return (
    <primitive
      object={scene}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
      ref={modelRef}
    />
  );
};

const Model2 = () => {
  const [selectedPart, setSelectedPart] = useState(null);
  const [materialUpdates, setMaterialUpdates] = useState({});
  const [selectedTile, setSelectedTile] = useState(null);
  const [selectedTileCategory, setSelectedTileCategory] =
    useState("Vitrified Tile");
  const [tileScaleX, setTileScaleX] = useState(1);
  const [tileScaleY, setTileScaleY] = useState(1);
  const scrollRef = useRef(null);
  const [isLoading, setIsLoading] = useState(true); // Add loading state

  const handlePartSelection = (partId, materialName) => {
    setSelectedPart({ id: partId, name: materialName });
    const existingProps = materialUpdates[partId] || {};
    setTileScaleX(existingProps.tileScaleX || 1);
    setTileScaleY(existingProps.tileScaleY || 1);
  };

  const handleTileCategoryChange = (event) => {
    setSelectedTileCategory(event.target.value);
    setSelectedTile(null); // Reset tile selection when the category changes
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  };

  const applyTile = () => {
    if (selectedPart && selectedTile) {
      setMaterialUpdates((prevUpdates) => ({
        ...prevUpdates,
        [selectedPart.id]: { texture: selectedTile, tileScaleX, tileScaleY },
      }));
    }
  };

  const selectedCategoryTiles =
    tilesData.find((category) => category.category === selectedTileCategory)
      ?.tiles || [];

  const handlePrint = () => {
    window.print();
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator
        .share({
          title: "Interactive Page",
          text: "Check out this amazing page!",
          url: window.location.href,
        })
        .catch((error) => console.error("Error sharing:", error));
    } else {
      alert("Sharing is not supported in this browser.");
    }
  };

  const handleReset = () => {
    window.location.reload();
  };

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 3000); // Simulate loading
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="main">
      {isLoading ? (
        <div className="loader-container">
        <Blocks
  ariaLabel="loading"
    wrapperStyle={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh", // Full viewport height for centering vertically
    width: "100vw", // Full viewport width for centering horizontally
    backgroundColor: "#a20000", // Optional: Add a background overlay
  }}
/>
        </div>
      ) : (
        <div>
          <h2 className="main_heading">Customize Home Model</h2>
          <div className="row">
            <div className="col-lg-3 left" style={{ position: "relative" }}>
              {/* Left panel code */}
              <div>
                <div className="select_part text-center pt-3 ">
                  <h5>Selected Part</h5>
                  <p className="fw-bold" style={{ color: "#a20000" }}>
                    {selectedPart
                      ? selectedPart.name
                      : "Click on a part of the model"}
                  </p>
                </div>
                <div
                  className="tiles"
                  style={{ paddingLeft: "10px", textAlign: "center" }}
                >
                  <h4>Choose Tiles</h4>
                  <select
                    className="selctdrag"
                    onChange={handleTileCategoryChange}
                    value={selectedTileCategory}
                    style={{ marginBottom: "10px" }}
                  >
                    {tilesData.map((category) => (
                      <option key={category.category} value={category.category}>
                        {category.category}
                      </option>
                    ))}
                  </select>
                  <div
                    ref={scrollRef}
                    className="custom-scroll"
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      justifyContent: "center",
                      height: "45vh",
                      overflowY: "scroll",
                      backgroundColor: "white",
                      padding: "10px",
                    }}
                  >
                    {selectedCategoryTiles.map((tile) => (
                      <div
                        key={tile.id}
                        style={{
                          padding: "3px",
                          width: "155px",
                          height: "155px",
                          cursor: "pointer",
                          boxShadow: "1px 1px 3px black",
                          border:
                            selectedTile === tile.image
                              ? "3px solid green"
                              : "1px solid gray",
                        }}
                        onClick={() => setSelectedTile(tile.image)}
                      >
                        <img
                          src={tile.image}
                          alt={tile.name}
                          style={{ width: "125px", height: "125px" }}
                        />
                        <p className="pb-1">{tile.name}</p>
                      </div>
                    ))}
                  </div>
                  <div
                    className="d-flex gap-3  align-items-center justify-content-center mt-2 p-2"
                    style={{ backgroundColor: "#a20000" }}
                  >
                    <p
                      style={{
                        fontSize: "20px",
                        color: "yellow",
                        marginBottom: "0px",
                      }}
                    >
                      Tile Scale :
                    </p>
                    <div className="d-flex gap-3">
                      <p
                        className="fs-bold fs-5"
                        style={{ color: "#fff", marginBottom: "0px" }}
                      >
                        X:
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={tileScaleX}
                          onChange={(e) =>
                            setTileScaleX(parseFloat(e.target.value))
                          }
                          disabled={!selectedTile}
                          style={{
                            width: "47px",
                            borderRadius: "5px",
                            marginLeft: "5px",
                          }}
                        />
                      </p>
                      <p
                        className="fs-bold fs-5"
                        style={{ color: "#fff", marginBottom: "0px" }}
                      >
                        Y:
                        <input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={tileScaleY}
                          onChange={(e) =>
                            setTileScaleY(parseFloat(e.target.value))
                          }
                          disabled={!selectedTile}
                          style={{
                            width: "47px",
                            borderRadius: "5px",
                            marginLeft: "5px",
                          }}
                        />
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-success fw-bolder mt-2"
                    onClick={applyTile}
                    disabled={!selectedTile || !selectedPart}
                  >
                    Apply Tile
                  </button>
                </div>
              </div>
            </div>
            <div className="col-lg-9">
              <div
                style={{ width: "100%", height: "100vh" }}
                className="model-container"
              >
                <Canvas style={{ width: "100%", height: "100vh" }}>
                  <ambientLight intensity={1} />
                  <directionalLight position={[22, 20, 10]} />
                  <OrbitControls
                    enablePan={true}
                    enableZoom={true}
                    enableRotate={true}
                    maxPolarAngle={Math.PI / 2}
                    minPolarAngle={0}
                    enableDamping={true}
                    dampingFactor={0.9}
                  />

                  <React.Suspense fallback={null}>
                    <Bounds fit clip margin={2}>
                      <DynamicMaterialModel
                        modelPath="https://ssvconstructions.in/wp-content/uploads/2025/01/glb_files/3d_house.glb"
                        materialUpdates={materialUpdates}
                        onPartSelected={handlePartSelection}
                      />
                    </Bounds>
                  </React.Suspense>
                </Canvas>
              </div>
              {/* Buttons and Footer */}
              <div className="d-flex  gap-2 justify-content-center">
                <div>
                  <button
                    onClick={handlePrint}
                    className="w-30 fw-bold"
                    style={{
                      color: "white",
                      backgroundColor: "#800000",
                      borderRadius: "10px",
                      border: "none",
                      padding: "5px",
                    }}
                  >
                    <img
                      src="	https://cdn-icons-png.flaticon.com/512/10009/10009249.png"
                      alt="SSV"
                      className="footer-image m-1"
                      width="20px"
                      height="20px"
                    />{" "}
                    Download
                  </button>
                </div>
                <div>
                  <button
                    onClick={handleShare}
                    className="w-30 fw-bold"
                    style={{
                      color: "white",
                      backgroundColor: "#800000",
                      borderRadius: "10px",
                      border: "none",
                      padding: "5px",
                    }}
                  >
                    <img
                      src="https://cdn-icons-png.flaticon.com/128/189/189676.png"
                      alt="SSV"
                      className="footer-image m-1"
                      width="20px"
                      height="20px"
                    />{" "}
                    Share
                  </button>
                </div>
                <div>
                  <button
                    onClick={handleReset}
                    className="w-30 fw-bold"
                    style={{
                      color: "white",
                      backgroundColor: "#800000",
                      borderRadius: "10px",
                      border: "none",
                      padding: "5px",
                    }}
                  >
                    <img
                      src="https://ssvconstructions.in/wp-content/uploads/2025/01/glb_files/3d_house.glb"
                      alt="SSV"
                      className="footer-image m-1"
                      width="20px"
                      height="20px"
                    />{" "}
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Model2;
