// obstacle manager 
// provides a single adjustable, semi-transparent rectangle
// the rectangle has 4 control points (corners) that can be dragged with the mouse

// TODO: instead of obstructing a zone, it would be nicer to declare alowed area

class ObstacleManager {
    constructor() {
        // default rectangle centered in canvas with 8 control points
        const w = Math.min(windowWidth, windowHeight) * 0.4;
        const h = Math.min(windowWidth, windowHeight) * 0.25;
        const cx = windowWidth / 2;
        const cy = windowHeight / 2;
        this.points = [
            createVector(cx - w/2, cy - h/2),     // top-left corner
            createVector(cx, cy - h/2),           // top-middle
            createVector(cx + w/2, cy - h/2),     // top-right corner
            createVector(cx + w/2, cy),           // right-middle
            createVector(cx + w/2, cy + h/2),     // bottom-right corner
            createVector(cx, cy + h/2),           // bottom-middle
            createVector(cx - w/2, cy + h/2),     // bottom-left corner
            createVector(cx - w/2, cy)            // left-middle
        ];

        this.draggingIndex = -1;
        this.draggingShape = false; // true when dragging the entire shape
        this.dragStartMouse = null; // mouse position when drag started
        this.dragStartPoints = []; // point positions when drag started
        this.handleRadius = 10;
        this.pushStrength = 5; // default push strength
        
        // mode: 'none', 'avoid', 'contain-clip', 'contain-push', 'attract'
        this.mode = 'none';
        this.updateColors();
    }
    
    // set mode explicitly
    setMode(mode) {
        this.mode = mode;
        this.updateColors();
    }
    
    // update colors based on current mode
    updateColors() {
        switch(this.mode) {
            case 'none':
                this.fillColor = color(128, 128, 128, 60);
                this.strokeColor = color(128, 128, 128, 150);
                break;
            case 'avoid':
                this.fillColor = color(255, 100, 100, 80);
                this.strokeColor = color(255, 100, 100, 180);
                break;
            case 'contain-clip':
                this.fillColor = color(100, 200, 255, 80);
                this.strokeColor = color(100, 200, 255, 180);
                break;
            case 'contain-push':
                this.fillColor = color(0, 255, 150, 80);
                this.strokeColor = color(0, 255, 150, 180);
                break;
            case 'attract':
                this.fillColor = color(255, 200, 0, 80);
                this.strokeColor = color(255, 200, 0, 180);
                break;
            default:
                this.fillColor = color(128, 128, 128, 60);
                this.strokeColor = color(128, 128, 128, 150);
        }
    }

    draw(g = window) {
        g.push();
        g.noStroke();
        g.fill(this.fillColor);
        g.beginShape();
        for (let p of this.points) g.vertex(p.x, p.y);
        g.endShape(CLOSE);

        // draw border and handles
        g.stroke(this.strokeColor);
        g.strokeWeight(2);
        g.noFill();
        g.beginShape();
        for (let p of this.points) g.vertex(p.x, p.y);
        g.endShape(CLOSE);

        // handles
        g.fill(this.strokeColor);
        g.noStroke();
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            g.ellipse(p.x, p.y, this.handleRadius, this.handleRadius);
        }
        g.pop();
    }

    // call when mouse is pressed; returns true if a handle or shape was grabbed
    mousePressed(mx, my) {
        // first check if we clicked on a handle
        for (let i = 0; i < this.points.length; i++) {
            const p = this.points[i];
            if (dist(mx, my, p.x, p.y) <= this.handleRadius) {
                this.draggingIndex = i;
                return true;
            }
        }
        
        // if not on a handle, check if inside the shape
        if (this.isPointInside(mx, my)) {
            this.draggingShape = true;
            this.dragStartMouse = createVector(mx, my);
            // store current positions of all points
            this.dragStartPoints = this.points.map(p => p.copy());
            return true;
        }
        
        return false;
    }

    mouseDragged(mx, my) {
        // dragging a single handle
        if (this.draggingIndex >= 0) {
            this.points[this.draggingIndex].x = mx;
            this.points[this.draggingIndex].y = my;
            return true;
        }
        
        // dragging the entire shape
        if (this.draggingShape && this.dragStartMouse) {
            const dx = mx - this.dragStartMouse.x;
            const dy = my - this.dragStartMouse.y;
            
            // update all points based on the offset
            for (let i = 0; i < this.points.length; i++) {
                this.points[i].x = this.dragStartPoints[i].x + dx;
                this.points[i].y = this.dragStartPoints[i].y + dy;
            }
            return true;
        }
        
        return false;
    }

    mouseReleased() {
        this.draggingIndex = -1;
        this.draggingShape = false;
        this.dragStartMouse = null;
        this.dragStartPoints = [];
    }

    // check if a point is inside the obstacle polygon
    isPointInside(x, y) {
        // use ray casting algorithm
        let inside = false;
        const n = this.points.length;
        
        for (let i = 0, j = n - 1; i < n; j = i++) {
            const xi = this.points[i].x, yi = this.points[i].y;
            const xj = this.points[j].x, yj = this.points[j].y;
            
            const intersect = ((yi > y) !== (yj > y))
                && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        
        return inside;
    }

    // adjust a point based on the current mode
    // returns the adjusted point
    avoidPoint(point, pushStrength = null) {
        if (this.mode === 'none') {
            return point;
        }
        
        const isInside = this.isPointInside(point.x, point.y);
        const strength = pushStrength !== null ? pushStrength : this.pushStrength;
        
        // find center of obstacle
        let centerX = 0, centerY = 0;
        for (let p of this.points) {
            centerX += p.x;
            centerY += p.y;
        }
        centerX /= this.points.length;
        centerY /= this.points.length;
        
        // handle different modes
        switch(this.mode) {
            case 'avoid':
                // push points out if they're inside
                if (!isInside) return point;
                return this.pushFromBoundary(point, centerX, centerY, strength, true);
                
            case 'contain-clip':
                // clip points to nearest boundary if outside
                if (isInside) return point;
                return this.clipToNearestBoundary(point);
                
            case 'contain-push':
                // push points toward center if outside
                if (isInside) return point;
                return this.pushTowardCenter(point, centerX, centerY, strength);
                
            case 'attract':
                // pull all points toward center
                return this.attractToCenter(point, centerX, centerY, strength);
                
            default:
                return point;
        }
    }
    
    // push point away from boundary (for avoid mode)
    pushFromBoundary(point, centerX, centerY, strength, outward) {
        // calculate direction from center to point
        let dx = point.x - centerX;
        let dy = point.y - centerY;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 0.1) {
            // point is at center, use random direction
            dx = Math.random() - 0.5;
            dy = Math.random() - 0.5;
            dist = Math.sqrt(dx * dx + dy * dy);
        }
        
        // normalize
        dx /= dist;
        dy /= dist;
        
        // find closest edge distance
        let minDist = Infinity;
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];
            const d = this.pointToSegmentDistance(point.x, point.y, p1.x, p1.y, p2.x, p2.y);
            if (d < minDist) minDist = d;
        }
        
        // push outward
        const pushDistance = minDist + strength * 2;
        
        return createVector(
            point.x + dx * pushDistance,
            point.y + dy * pushDistance
        );
    }
    
    // clip point to nearest boundary point (for contain-clip mode)
    clipToNearestBoundary(point) {
        let closestPoint = null;
        let minDist = Infinity;
        
        // check all edges
        for (let i = 0; i < this.points.length; i++) {
            const p1 = this.points[i];
            const p2 = this.points[(i + 1) % this.points.length];
            const projected = this.projectPointOntoSegment(point.x, point.y, p1.x, p1.y, p2.x, p2.y);
            const d = dist(point.x, point.y, projected.x, projected.y);
            
            if (d < minDist) {
                minDist = d;
                closestPoint = projected;
            }
        }
        
        return createVector(closestPoint.x, closestPoint.y);
    }
    
    // push point toward center (for contain-push mode)
    pushTowardCenter(point, centerX, centerY, strength) {
        // calculate direction from point to center
        let dx = centerX - point.x;
        let dy = centerY - point.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 0.1) return point;
        
        // normalize
        dx /= dist;
        dy /= dist;
        
        // push toward center with strength
        const pushDistance = strength * 3;
        
        return createVector(
            point.x + dx * pushDistance,
            point.y + dy * pushDistance
        );
    }
    
    // attract point toward center (for attract mode)
    attractToCenter(point, centerX, centerY, strength) {
        // calculate direction from point to center
        let dx = centerX - point.x;
        let dy = centerY - point.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < 1) return point;
        
        // normalize
        dx /= dist;
        dy /= dist;
        
        // subtle attraction proportional to distance
        const attractDistance = Math.min(dist * 0.1, 1) * strength * 2;
        
        return createVector(
            point.x + dx * attractDistance,
            point.y + dy * attractDistance
        );
    }
    
    // project point onto line segment
    projectPointOntoSegment(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            return {x: x1, y: y1};
        }
        
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        
        return {
            x: x1 + t * dx,
            y: y1 + t * dy
        };
    }

    // calculate distance from point to line segment
    pointToSegmentDistance(px, py, x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const lengthSquared = dx * dx + dy * dy;
        
        if (lengthSquared === 0) {
            return Math.sqrt((px - x1) * (px - x1) + (py - y1) * (py - y1));
        }
        
        let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared;
        t = Math.max(0, Math.min(1, t));
        
        const projX = x1 + t * dx;
        const projY = y1 + t * dy;
        
        return Math.sqrt((px - projX) * (px - projX) + (py - projY) * (py - projY));
    }
}

// export for use in other scripts
window.ObstacleManager = ObstacleManager;
