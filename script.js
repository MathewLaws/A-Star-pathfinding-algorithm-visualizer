document.addEventListener("DOMContentLoaded", () => {
    let size = 21
    let allow_corners_input = document.getElementById("allow-corners")
    let allow_corners = allow_corners_input.checked
    let speed = 30
    let table = document.getElementById("table");
    let inProcess = false;

    function heuristic(node, goal) {
        node_id = row_col(node.cell)
        goal_id = row_col(goal.cell)
        return (Math.abs(node_id[0] - goal_id[0]) + Math.abs(node_id[1] - goal_id[1]))
    }

    const row_col = (node) => {return node.id.split("-").map(x => x = parseInt(x))}

    function reveal_path(path) {
        let i = path.length-1;

        (function nextIter() {
            if (i < 0) return
            if (i >= 1 && i < path.length-1)
            path[i].cell.classList.add("path")
            path[i].cell.classList.remove("open")
            path[i].cell.classList.remove("closed")
            i -= 1
            setTimeout(nextIter, speed)
        })();
    }

    const Cell = (c) => {
        return {
            cell: c,
            g_score: Number.POSITIVE_INFINITY,
            h_score: Number.POSITIVE_INFINITY,
            f_score: Number.POSITIVE_INFINITY,
            previous: undefined,
            previous2: undefined,
            visited: false
        }
    }

    // f(n) = g(n) + h(n)
    function A_Star(start, goal) {
        inProcess = true
        let openSet = [start];
        let closedSet = [];
        let current = openSet[0];
        let temp_current = 0;
        let min;

        allow_corners = allow_corners_input.checked;
        
        openSet[0].g_score = 0;
        openSet[0].h_score = heuristic(openSet[0], goal);
        openSet[0].f_score = openSet[0].g_score + openSet[0].h_score;

        (function nextIter() {
            min = Number.POSITIVE_INFINITY
            temp_current = 0
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f_score < min && openSet[i].cell.classList.contains("closed") == false) {
                    temp_current = openSet[i]
                    min = temp_current.f_score
                }
            }

            current = temp_current
            current.cell.classList.add("open")

            if (current.cell === goal.cell) {
                
                let path = []
                path.push(current)
                while (current.previous && current != start) {
                    path.push(current.previous)
                    current = current.previous
                }

                reveal_path(path)
                
                console.log("Done")
                inProcess = false
                return 1
            }

            for (let i=openSet.length-1; i >= 0; i--) {
                if (openSet[i] == current) {
                    openSet.splice(i, 1)
                }
            }

            current.cell.classList.remove("open")
            current.cell.classList.add("closed")

            getNeighbors(current.cell).forEach(neighbor => {
                neighbor.g_score = current.g_score + 1
                neighbor.h_score = heuristic(neighbor, goal)
                neighbor.f_score = neighbor.g_score + neighbor.h_score

                if (!(neighbor in openSet) && !(neighbor in closedSet) && (neighbor.cell.classList.contains("barrier") == false)) {
                        openSet.push(neighbor)
                        neighbor.cell.classList.add("open")
                        if (!(neighbor.previous)) neighbor.previous = current
                }
            })
            if (speed > 0) setTimeout(nextIter, speed)
            else nextIter()
        })();

        return -1
    }

    function get_valid_spaces() {
        let valid_maze = []
        for (let i=0; i < size; i++) {
            for (let j=0; j < size; j++) {
                if (!(grid[i][j].cell.classList.contains("barrier"))) valid_maze.push(grid[i][j])
            }
        }

        return valid_maze
    }
    
    function recursive_backtracking_maze() {
        let neighbors;
        let valid_neighbors;
        let chosen;
        let x_y;
        let x_y2;
        inProcess = true
        for (let i=0; i < size; i++) {
            for (let j=0; j < size; j++) {
                if (j % 2 == 0 || i % 2 == 0) {
                    grid[i][j].cell.classList.add("barrier")
                }
            }
        }
        let valid_maze = get_valid_spaces();
        let rand = random_pos(true, valid_maze);
        (function nextIter(c = rand) {
            c.visited = true
            neighbors = getNeighbors(c.cell, true, valid_maze)
            valid_neighbors = []
            for (let i=0; i < neighbors.length; i++) {
                if (!(neighbors[i].visited) && neighbors[i] != rand) {
                    valid_neighbors.push(neighbors[i])
                }
            }

            if (valid_neighbors.length >= 1) {
                chosen = valid_neighbors[Math.floor(Math.random() * valid_neighbors.length)]
                chosen.previous2 = c
                c = chosen
            }

            if (c.cell == rand.cell) {inProcess = false; return }

            if (valid_neighbors.length == 0) {
                setTimeout(function() {nextIter(c.previous2)}, 0)
            } else {
                x_y = row_col(c.cell)
                x_y2 = row_col(c.previous2.cell)
                grid[Math.min(x_y[0],x_y2[0]) + (Math.abs(x_y[0] - x_y2[0])/2)][Math.min(x_y[1],x_y2[1]) + (Math.abs(x_y[1] - x_y2[1])/2)].cell.classList.remove("barrier")
                setTimeout(function() {nextIter(c)}, 0)
            }
        })();
    }

    function getNeighbors(cell = undefined, maze_gen = false, valid_maze = []) {
        let neighbors = []
        let x_y = row_col(cell)
        let cell_x = x_y[0]
        let cell_y = x_y[1]
        if (maze_gen) {
            for (let i=-2; i <= 2; i+=4) {
                if (cell_y + i > 0 && cell_y + i < size-1) {
                    neighbors.push(grid[cell_x][cell_y+i])
                }
                if (cell_x + i > 0 && cell_x + i < size-1) {
                    neighbors.push(grid[cell_x+i][cell_y])
                }
            }
        }else if (allow_corners) {
            for (let i=-1; i < 2; i++) {
                for (let j=-1; j < +2; j++) {
                    if (cell_y + j > -1 && cell_y + j <= size-1 && cell_x + i > -1 && cell_x + i <= size-1) {
                        neighbors.push(grid[cell_x+i][cell_y+j])
                    }
                }
            }
        } else if (!(allow_corners)){
            for (let i=-1; i < 2; i+=2) {
                if (cell_y + i > -1 && cell_y + i <= size-1) {
                    neighbors.push(grid[cell_x][cell_y+i])
                }
                if (cell_x + i > -1 && cell_x + i <= size-1) {
                    neighbors.push(grid[cell_x+i][cell_y])
                }
            }
        }

        return neighbors
    }

    let start = false
    let end = false
    let hold_right = false
    let hold_left = false
    let spot = undefined

    table.addEventListener("mousedown", (x) => {
        if (inProcess) return
        if (x.button == 0) hold_right = true
        else if (x.button == 2) hold_left = true
        colour_square(x)
    })

    document.addEventListener("mouseup", () => {hold_right = false; hold_left = false})

    function colour_square(x) {
        if (hold_right || hold_left) {
            if (x.target.id === "table") return
            let x_y = row_col(x.target)
            spot = grid[x_y[0]][x_y[1]]
            if (hold_right) {
                if (spot != end&& !(spot.cell.classList.contains("barrier")) && !start) {
                    spot.cell.classList.add("start")
                    start = spot
                }
                else if (spot != start && !(spot.cell.classList.contains("barrier")) && !end) {
                    spot.cell.classList.add("end")
                    end = spot
                }
                else if (spot != start && spot != end && start && end) {
                    spot.cell.classList.add("barrier")
                }
            }
            else if (hold_left) {
                if (spot == start) {
                    spot.cell.classList.remove("start")
                    start = false
                }
                else if (spot == end) {
                    spot.cell.classList.remove("end")
                    end = false
                }
                else {
                    spot.cell.classList.remove("barrier")
                }
            }
        }
    }

    table.addEventListener("mousemove", (x) => {
        if (inProcess) return
        colour_square(x)
    })

    let grid = []

    function createBoard() {
        let s = ""
        for (let i=0; i < size; i++) {
            let row = document.createElement("tr")
            table.appendChild(row)
            grid[i] = []
            for (let j=0; j < size; j++) {
                let cell = document.createElement("td")
                row.appendChild(cell)
                cell.id = (s.concat(i,"-", j))
                grid[i][j] = Cell(cell)
            }
        }
    }

    createBoard()

    const random_pos = (maze_pos = false, valid_maze = []) => {
        if (!(maze_pos)) return grid[Math.floor(Math.random() * size)][Math.floor(Math.random() * size)]
        return valid_maze[Math.floor(Math.random() * valid_maze.length)]
    }

    document.addEventListener("keypress", x => {
        if (inProcess) return
        if (x.code == "Space" && start && end) {
            // change to refrence cell in grid array
            A_Star(start, end)
        }
    })

    document.getElementById("start-btn").addEventListener("click", function() {
        if (inProcess) return
        if (start && end) {
            A_Star(start, end)
        }
    })

    function clear_board() {
        table.innerHTML = ""
        start = false
        end = false
    }

    document.getElementById("clear-btn").addEventListener("click", () => {
        if (inProcess) return
        clear_board()
        createBoard()
    })

    let speed_options = document.querySelectorAll(".speed-option")

    speed_options.forEach(option => {
        option.addEventListener("click", (x) => {
            switch(x.target.id) {
                case 's': {
                    speed = 100
                    break
                }
                case 'm': {
                    speed = 30
                    break
                }
                case 'f': {
                    speed = 10
                    break
                }
                case 'i': {
                    speed = 0
                    break
                }
            }
        })
    })

    function generate_random_maze() {
        for (let i=0; i < size; i++) {
            for (let j=0; j < size; j++) {
                s = grid[i][j]
                Math.floor(Math.random()*3) == 2 ? s.cell.classList.add("barrier") : null
            }
        }
    }

    let pattern_options = document.querySelectorAll(".pattern-options")

    pattern_options.forEach(option => {
        option.addEventListener("click", (x) => {
            if (inProcess) return
            switch(x.target.id) {
                case 'r': {
                    clear_board()
                    createBoard()
                    generate_random_maze()
                    break
                }
                case 'b': {
                    clear_board()
                    createBoard()
                    recursive_backtracking_maze()
                    break
                }
            }
        })
    })

    let size_btn = document.querySelector("#size-btn")
    
    size_btn.addEventListener("click", () => {
        if (inProcess) return
        let size_input = document.querySelector("#size-input").value

        if (size_input > 1) {
            clear_board()
            size = size_input
            createBoard()
        }
    })

    let lastRenderTime = 0

    function main(currentTime) {

        window.requestAnimationFrame(main)
        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000
        if (secondsSinceLastRender < 1 / 30) return

        lastRenderTime = currentTime
    }

    window.requestAnimationFrame(main)

})
