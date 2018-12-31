BOARD_WIDTH = 40;
BOARD_LENGTH = 28;
BOARD_HEIGHT = 18;
WALL = 2;

translate([BOARD_WIDTH * -0.75, 0, 0])
case();
translate([BOARD_WIDTH * 0.75, 0, BOARD_HEIGHT * -0.5])
rotate([0, 180, 0])
lid();

module case() {
  difference() {
    box(
      BOARD_WIDTH + WALL * 2,
      BOARD_LENGTH + WALL * 2,
      BOARD_HEIGHT + WALL
    );
    translate([0, 0, WALL])
    box(BOARD_WIDTH, BOARD_LENGTH, BOARD_HEIGHT + WALL);
    translate([0, 0, BOARD_HEIGHT * 0.5])
    box(BOARD_WIDTH / 3, BOARD_LENGTH * 2, BOARD_HEIGHT);
    translate([BOARD_WIDTH * 0.5, 0, BOARD_HEIGHT / 3])
    box(BOARD_WIDTH * 2, BOARD_LENGTH - WALL * 2, BOARD_HEIGHT);
  }
}

module lid() {
  union() {
    difference() {
      box(
        (BOARD_WIDTH + WALL * 2) * 0.75,
        BOARD_LENGTH + WALL * 2,
        WALL
      );
      rotate([0, 0, -90]) {
        translate([0, -4, 0])
        triangle(8, 8, 8);
        translate([-4, 4, 0])
        triangle(8, 8, 8);
        translate([4, 4, 0])
        triangle(8, 8, 8);
      }
    }
    for(i = [-0.5,0.5])
    translate([(BOARD_WIDTH + WALL * 2) * -0.125, (BOARD_LENGTH - WALL * 0.5 - 0.5) * i, BOARD_HEIGHT * -0.2])
    box(
      BOARD_WIDTH * 0.5 - 1,
      WALL,
      BOARD_HEIGHT * 0.4
    );
    translate([BOARD_WIDTH * 0.375 - WALL * 0.5 - 0.8, 0, BOARD_HEIGHT * -0.2])
    box(
      WALL,
      BOARD_LENGTH - 1,
      BOARD_HEIGHT * 0.4
    );
  }
}

module box(w, l, h, corner = 1) {
  minkowski() {
    cube([w - corner, l - corner, h - corner], center = true);
    sphere(d = corner, center = true, $fn = 32);
  }
}

module triangle(w, l, h, corner = 2) {
  minkowski() {
    translate([0, 0, h * -0.5])
    linear_extrude(height=h)
    polygon(
      points=[
        [(w - corner * 1.25) * -0.5, (l - corner * 1.25) * 0.5],
        [(w - corner * 1.25) * 0.5, (l - corner * 1.25) * 0.5],
        [0, (l - corner * 1.25) * -0.5]
      ],
      paths=[[0,1,2]]
    );
    sphere(d = corner, center = true, $fn = 32);
  }
}
