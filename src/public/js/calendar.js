const $calendar = document.querySelector(".calendar");
const fragment = document.createDocumentFragment();

const $table = document.createElement("table");
const $thead = document.createElement("thead");
const $tbody = document.createElement("tbody");

$thead.innerHTML = `
<tr>
    <td></td>
    <td>Sunday</td>
    <td>Monday</td>
    <td>Tuesday</td>
    <td>Wednesday</td>
    <td>Thursday</td>
    <td>Friday</td>
    <td>Saturday</td>
</tr>
`;

for (let i = 0; i < 24; i++) {
    const $tr = document.createElement("tr");
    const $td = document.createElement("td");
    $td.textContent = i <= 12 ? `${i} AM` : `${i - 12} PM`;
    $td.classList = "hour";
    $tr.appendChild($td);
    for (let j = 0; j < 7; j++) {
        const $td = document.createElement("td");
        $td.classList = "cell";
        $td.id = `cell${j + 7 * i}`;
        $tr.appendChild($td);
    }
    $tbody.appendChild($tr);
}

$table.appendChild($thead);
$table.appendChild($tbody);

fragment.appendChild($table);

$calendar.appendChild(fragment);

let cellMouseDown;

$tbody.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("cell")) {
        cellMouseDown = e.target;
    }
});

$tbody.addEventListener("mouseup", (e) => {
    if (e.target.classList.contains("cell") && cellMouseDown) {
        const cellFrom = cellMouseDown;
        const cellTo = e.target;
        cellMouseDown = undefined;

        if (cellFrom === cellTo) {
            cellFrom.classList.toggle("selected");
        } else {
            const from = +cellFrom.id.split("cell")[1];
            const to = +cellTo.id.split("cell")[1];

            const min = Math.min(from, to);
            const max = Math.max(from, to);

            let xCells = (max % 7) - (min % 7);
            const xStep = xCells ? xCells / Math.abs(xCells) : 1;
            xCells += xStep;

            let yCells = Math.floor(max / 7) - Math.floor(min / 7);
            const yStep = yCells ? yCells / Math.abs(yCells) : 1;
            yCells += yStep;

            const selectedCells = [];
            for (let i = 0; i != yCells; i += yStep) {
                for (let j = 0; j != xCells; j += xStep) {
                    const id = min + i * 7 + j;
                    selectedCells.push(document.getElementById(`cell${id}`));
                }
            }
            if (
                selectedCells.every(
                    (cell) =>
                        cell.classList.contains("selected") ===
                        selectedCells[0].classList.contains("selected")
                )
            ) {
                selectedCells.forEach((cell) =>
                    cell.classList.toggle("selected")
                );
            } else {
                selectedCells.forEach((cell) => cell.classList.add("selected"));
            }
        }
    }
});
