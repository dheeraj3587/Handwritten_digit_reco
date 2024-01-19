// Variables for the canvas and drawing context
const canvasInput = document.getElementById("inputimg");
const contextInput = canvasInput.getContext("2d");
const outputDiv = document.getElementById("pred");
let probabilityGraph = null;
let isLeftMouseButtonPressed = false;

// Initialize the canvas
window.onload = () => {
    contextInput.fillStyle = "white";
    contextInput.fillRect(0, 0, canvasInput.width, canvasInput.height);
    contextInput.lineWidth = 7;
    contextInput.lineCap = "round";
    initializeProbabilityGraph();
}

// Function to initialize the probability graph
function initializeProbabilityGraph() {
    const dummyData = [1, 1, 1, 1, 1, 1, 1, 1, 1, 1]; // Dummy data for initializing the graph
    const margin = { top: 10, right: 10, bottom: 10, left: 20 };
    const width = 250;
    const height = 196;

    const yScale = d3.scaleLinear()
        .domain([9, 0])
        .range([height, 0]);

    probabilityGraph = d3.select("#probGraph")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    probabilityGraph.append("g")
        .attr("class", "y axis")
        .call(d3.axisLeft(yScale));

    const barHeight = 20;
    probabilityGraph.selectAll("svg")
        .data(dummyData)
        .enter()
        .append("rect")
        .attr("y", (d, i) => (yScale(i) - barHeight / 2))
        .attr("height", barHeight)
        .style("fill", "green")
        .attr("x", 0)
        .attr("width", d => d * 2)
        .call(d3.axisLeft(yScale));
}

// Event listeners for mouse and touch interactions
canvasInput.addEventListener("mousedown", handleMouseDown);
canvasInput.addEventListener("mouseup", handleMouseUp);
canvasInput.addEventListener("mousemove", handleMouseMove);
canvasInput.addEventListener("touchstart", handleTouchStart);
canvasInput.addEventListener("touchmove", handleTouchMove);
canvasInput.addEventListener("touchend", handleTouchEnd);
canvasInput.addEventListener("contextmenu", e => e.preventDefault());

// Event handler for clearing the canvas
document.getElementById("clearbtn").onclick = clearCanvas;
function clearCanvas() {
    isLeftMouseButtonPressed = false;
    contextInput.fillStyle = "white";
    contextInput.fillRect(0, 0, canvasInput.width, canvasInput.height);
    contextInput.fillStyle = "black";
}

// Event handler for triggering digit recognition
function handleRecognition() {
    console.time("time");

    canvasInput.toBlob(async blob => {
        const body = new FormData();
        body.append('img', blob, "dummy.png")
        try {
            const response = await fetch("./DigitRecognition", {
                method: "POST",
                body: body,
            })
            const jsonResponse = await response.json()
            showRecognitionResult(jsonResponse)
        } catch (error) {
            alert("error", error)
        }
    })

    console.timeEnd("time");
}

// Function to display recognition result
function showRecognitionResult(result) {
    outputDiv.textContent = result.pred;
    document.getElementById("prob").innerHTML =
        "Probability : " + result.probs[result.pred].toFixed(2) + "%";
    probabilityGraph.selectAll("rect")
        .data(result.probs)
        .transition()
        .duration(300)
        .style("fill", (d, i) => i === result.pred ? "blue" : "green")
        .attr("width", d => d * 2)
}

// Event handlers for mouse interactions
function handleMouseDown(e) {
    if (e.button === 0) {
        const rect = e.target.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        isLeftMouseButtonPressed = true;
        contextInput.beginPath();
        contextInput.moveTo(x, y);
    } else if (e.button === 2) {
        clearCanvas(); // Clear with the right mouse button
    }
}

function handleMouseUp(e) {
    if (e.button === 0) {
        isLeftMouseButtonPressed = false;
        handleRecognition();
    }
}

function handleMouseMove(e) {
    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    if (isLeftMouseButtonPressed) {
        contextInput.lineTo(x, y);
        contextInput.stroke();
    }
}

// Event handlers for touch interactions
function handleTouchStart(e) {
    if (e.targetTouches.length === 1) {
        const rect = e.target.getBoundingClientRect();
        const touch = e.targetTouches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        contextInput.beginPath();
        contextInput.moveTo(x, y);
    }
}

function handleTouchMove(e) {
    if (e.targetTouches.length === 1) {
        const rect = e.target.getBoundingClientRect();
        const touch = e.targetTouches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        contextInput.lineTo(x, y);
        contextInput.stroke();
        e.preventDefault();
    }
}

function handleTouchEnd(e) {
    handleRecognition();
}
