const $calendar = document.querySelector(".calendar");
const fragment = document.createDocumentFragment();

const $table = document.createElement("table");
const $thead = document.createElement("thead");
const $tbody = document.createElement("tbody");

$thead.innerHTML = `
<tr>
    <td></td>
    <td>Domingo</td>
    <td>Lunes</td>
    <td>Martes</td>
    <td>Miércoles</td>
    <td>Jueves</td>
    <td>Viernes</td>
    <td>Sábado</td>
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

// document.querySelector('tbody').addEventListener('click', (e) => {
//     if(e.target.classList.contains('cell')) {
//         e.target.classList.toggle('selected');
//     }
// });

let cellMouseDown;

$tbody.addEventListener("mousedown", (e) => {
    if (e.target.classList.contains("cell")) {
        cellMouseDown = e.target;
    }
});

$tbody.addEventListener("mouseup", (e) => {
    console.log(e.target);
    if (e.target.classList.contains("cell") && cellMouseDown) {
        const cellFrom = cellMouseDown;
        const cellTo = e.target;
        cellMouseDown = undefined;

        if (cellFrom == cellTo) {
            cellFrom.classList.toggle("selected");
        } else {
            const from = +cellFrom.id.split("cell")[1];
            const to = +cellTo.id.split("cell")[1];

            const min = Math.min(from, to);
            const max = Math.max(from, to);

            for (let i = min; i <= max; i++) {
                document.getElementById(`cell${i}`).classList.add("selected");
            }
        }
    }
});
