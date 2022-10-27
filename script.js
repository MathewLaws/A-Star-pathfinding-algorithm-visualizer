document.addEventListener("DOMContentLoaded", () => {
    let cols = 20
    let rows = 20
    let table = document.getElementById("table");
    table.width = table.getBoundingClientRect().width;
    table.height = table.getBoundingClientRect().height;
    let ctx = table.getContext("2d")


    function reconstruct_path(cameFrom, current) {
        let total_path = {current}
        while (current in cameFrom.Keys) {
            let current = cameFrom[current]
            total_path.prepend(current)
        }
        return total_path
    }

    function heuristic(node, goal) {
        node.hScore = (Math.abs(goal.x - node.x) + Math.abs(goal.y - node.y))
        return node.hScore
    }

    // f(n) = g(n) + h(n)
    function A_Star(start, goal) {
        let openSet = [start]
        let closedSet = []
        let cameFrom = []
        
        start.g_score = 0
        start.h_score = heuristic(start, goal)
        start.f_score = start.g_score + start.h_score

        while (openSet) {
            let min = Number.POSITIVE_INFINITY
            let temp_current
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f_score < min && openSet[i].closed == false) {
                    temp_current = openSet[i]
                    min = temp_current.f_score
                }
            }

            current = temp_current
            current.open = true

            if (current === goal) {
                //return reconstruct_path(cameFrom, current)
                console.log("Done")
                return 1
            }

            // remove current from open set
            for (let i=openSet.length-1; i >= 0; i--) {
                if (openSet[i] == current) {
                    openSet.splice(i, 1)
                }
            }

            current.open = false
            current.closed = true

            current.getNeighbors().forEach(neighbor => {
                neighbor.g_score = current.g_score + 1
                neighbor.h_score = heuristic(neighbor, goal)
                neighbor.f_score = neighbor.g_score + neighbor.h_score

                if (!(neighbor in openSet) && !(neighbor in closedSet) && (neighbor.barrier == false)) {
                        openSet.push(neighbor)
                        neighbor.open = true
                }
            })
        }

        return -1
    }

    W = ctx.canvas.width / cols;
    H = ctx.canvas.height / rows;

    function Cell(x, y) {
        this.x = x
        this.y = y
        this.g_score = Number.POSITIVE_INFINITY
        this.h_score = Number.POSITIVE_INFINITY
        this.f_score = Number.POSITIVE_INFINITY
        this.closed = false
        this.open = false
        this.barrier = false
        this.start = false
        this.end = false

        this.show = () => {
            ctx.beginPath()
            if (this.barrier) {
                ctx.fillStyle = '#000000';
                ctx.fillRect(this.x*W, this.y*H, W, H);
            } else if (this.start) {
                ctx.fillStyle = '#00FF00';
                ctx.fillRect(this.x*W, this.y*H, W, H);
            } else if (this.end) {
                ctx.fillStyle = '#FF0000';
                ctx.fillRect(this.x*W, this.y*H, W, H);
            } else if (this.closed) {
                ctx.fillStyle = '#808080';
                ctx.fillRect(this.x*W, this.y*H, W, H);
            }
            else if (this.open) {
                ctx.fillStyle = '#FFA500';
                ctx.fillRect(this.x*W, this.y*H, W, H);
            }
            else {
                ctx.rect(this.x*W, this.y*H, W, H);
                ctx.stroke()
            }
        }

        this.getNeighbors = () => {
            this.neighbors = []
            
            for (let i=this.y-1; i < this.y+2; i++) {
                if (i <= -1 || i > 19) {
                    continue
                }
                for (let j=this.x-1; j < this.x+2; j++) {
                    if (j <= -1 || j > 19) {
                        continue
                    }
                    if (grid[i][j] != this) {
                        this.neighbors.push(grid[i][j])
                    }
                }
            }

            return this.neighbors
        }
    }

    function get_pos(x, y) {
        let i = Math.floor(x/W)
        let j = Math.floor(y/H)
        let spot = grid[j][i]
        return spot
    }

    let start = false
    let end = false
    let hold = false

    table.addEventListener("mousedown", (x) => {
        let spot = get_pos(x.offsetX, x.offsetY)
        if (x.button == 0) {
            if (!spot.start && !spot.end && !start) {
                spot.start = true
                start = spot
            }
            else if (!spot.end && !spot.start && !end) {
                spot.end = true
                end = spot
            }
            else if (!spot.start && !spot.end && start && end) {
                spot.barrier = true
            }
        }
        else if (x.button == 2) {
            if (spot.start) {
                spot.start = false
                start = false
            }
            else if (spot.end) {
                spot.end = false
                end = false
            }
            else {
                spot.barrier = false
            }
        }
    })

    grid = [];

    for (let i=0; i < cols; i++) {
        grid[i] = []
        for (let j=0; j < rows; j++) {
            grid[i][j] = new Cell(j, i);
        }
    }

    function update() {
        for (let i=0; i < cols; i++) {
            for (let j=0; j < rows; j++) {
                grid[i][j].show()
            }
        }
    }

    document.addEventListener("keypress", x => {
        if (x.code == "Space" && start && end) {
            A_Star(start, end)
        }
    })

    let lastRenderTime = 0

    function main(currentTime) {

        window.requestAnimationFrame(main)
        const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000
        if (secondsSinceLastRender < 1 / 30) return

        lastRenderTime = currentTime
        
        ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height)

        update()
    }

    window.requestAnimationFrame(main)

})
