document.addEventListener("DOMContentLoaded", () => {
    let size = 30
    let allow_corners_input = document.getElementById("allow-corners")
    let allow_corners = allow_corners_input.checked
    let speed = 30
    let table = document.getElementById("table");
    table.width = table.getBoundingClientRect().width;
    table.height = table.getBoundingClientRect().height;
    let ctx = table.getContext("2d")

    function heuristic(node, goal) {
        node.hScore = (Math.abs(goal.x - node.x) + Math.abs(goal.y - node.y))
        return node.hScore
    }

    function reveal_path(path) {
        let i = path.length-1;

        (function nextIter() {
            if (i < 0) return

            path[i].path = true
            i -= 1
            setTimeout(nextIter, speed)
        })();
    }

    // f(n) = g(n) + h(n)
    function A_Star(start, goal) {
        let openSet = [start];
        let closedSet = [];
        let current = start;
        let temp_current = 0;
        let min;

        allow_corners = allow_corners_input.checked;
        
        start.g_score = 0;
        start.h_score = heuristic(start, goal);
        start.f_score = start.g_score + start.h_score;

        (function nextIter() {
            min = Number.POSITIVE_INFINITY
            temp_current = 0
            for (let i = 0; i < openSet.length; i++) {
                if (openSet[i].f_score < min && openSet[i].closed == false) {
                    temp_current = openSet[i]
                    min = temp_current.f_score
                }
            }

            current = temp_current
            current.open = true

            if (current === goal) {
                
                let path = []
                path.push(current)
                while (current.previous && !(current === start)) {
                    path.push(current.previous)
                    current = current.previous
                }

                reveal_path(path)
                
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
                        if (!(neighbor.previous)) neighbor.previous = current
                }
            })
            if (speed > 0) setTimeout(nextIter, speed)
            else nextIter()
        })();

        return -1
    }

    W = ctx.canvas.width / size;
    H = ctx.canvas.height / size;

    function Cell(x, y) {
        this.x = x
        this.y = y
        this.g_score = Number.POSITIVE_INFINITY
        this.h_score = Number.POSITIVE_INFINITY
        this.f_score = Number.POSITIVE_INFINITY
        this.previous = undefined
        this.closed = false
        this.open = false
        this.path = false
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
            } else if (this.path) {
                ctx.fillStyle = '#A020F0';
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
        // need to change row and col operations to variables and not fixed numbers
        this.getNeighbors = () => {
            this.neighbors = []

            if (allow_corners) {
                for (let i=this.y-1; i < this.y+2; i++) {
                    if (i <= -1 || i > size-1) {
                        continue
                    }
                    for (let j=this.x-1; j < this.x+2; j++) {
                        if (j <= -1 || j > size-1) {
                            continue
                        }
                        if (grid[i][j] != this) {
                            this.neighbors.push(grid[i][j])
                        }
                    }
                }
            } else {
                for (let i=-1; i < 2; i+=2) {
                    if (this.x + i > -1 && this.x + i <= size-1) {
                        this.neighbors.push(grid[this.y][this.x + i])
                    }
                    if (this.y + i > -1 && this.y + i <= size-1) {
                        this.neighbors.push(grid[this.y + i][this.x])
                    }
                }
            }

            return this.neighbors
        }
    }

    function get_pos(x, y) {
        let rect = table.getBoundingClientRect()
        x = x - rect.left
        y = y - rect.top
        let i = Math.floor(x/W)
        let j = Math.floor(y/H)
        let spot = grid[j][i]
        return spot
    }

    let start = false
    let end = false
    let hold_right = false
    let hold_left = false
    let spot = undefined

    table.addEventListener("mousedown", (x) => {
        if (x.button == 0) hold_right = true
        else if (x.button == 2) hold_left = true
        pos = {
            "x": x.x, 
            "y": x.y
        }
        colour_square(pos)
    })

    document.addEventListener("mouseup", () => {hold_right = false; hold_left = false})

    function colour_square(pos) {
        if (hold_right || hold_left) {
            spot = get_pos(pos.x, pos.y)
            if (hold_right) {
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
            else if (hold_left) {
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
        }
    }

    table.addEventListener("mousemove", (pos) => colour_square(pos))

    grid = [];

    for (let i=0; i < size; i++) {
        grid[i] = []
        for (let j=0; j < size; j++) {
            grid[i][j] = new Cell(j, i);
        }
    }

    function update() {
        for (let i=0; i < size; i++) {
            for (let j=0; j < size; j++) {
                grid[i][j].show()
            }
        }
    }

    document.addEventListener("keypress", x => {
        if (x.code == "Space" && start && end) {
            A_Star(start, end)
        }
    })

    document.getElementById("start-btn").addEventListener("click", function() {
        if (start && end) {
            A_Star(start, end)
        }
    })

    document.getElementById("clear-btn").addEventListener("click", () => {
        for (let i=0; i < grid.length; i++) {
            for (let j=0; j < grid[i].length; j++) {
                grid[i][j] = new Cell(grid[i][j].x, grid[i][j].y)
                start = false
                end = false
            }
        }
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
        for (let i=0; i < grid.length; i++) {
            for (let j=0; j < grid[i].length; j++) {
                s = grid[i][j]
                if (s.start || s.end) {
                    continue
                }
                Math.floor(Math.random()*3) == 2 ? s.barrier = true : null
            }
        }
    }

    let pattern_options = document.querySelectorAll(".pattern-options")

    pattern_options.forEach(option => {
        option.addEventListener("click", (x) => {
            switch(x.target.id) {
                case 'r': {
                    generate_random_maze()
                    break
                }
            }
        })
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
