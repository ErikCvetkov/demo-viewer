$(document).ready(function() {
  //-----------BUTTON LOGIC------------
  $('.btnViewer').click(function(e) {
    var box = $(this).parent();
    var tool = $(box).find('.tool');
    if (tool) {
      var isOpen = tool.css('display');
      if (isOpen == 'block') {
        $(tool).hide();
        return;
      } else $(tool).show();
    }
    $(document).mouseup(function(a)
    {
      if (!box.is(a.target) && box.has(a.target).length === 0){
          tool.css('display','none');
          return;
      }
    });
  });
  var click = 0;
  var i = 0;
  var arrayOfGroups = [];
  var x1,x2,y1,y2;
  var width = $('#container').width();
  var height = $('#container').height();
  //--------------------LOADING IMAGES-------------------------
  function loadImages(sources, callback) {
    var images = {};
    var loadedImages = 0;
    var numImages = 0;
    for (var src in sources) {
      numImages++;
    }
    for (var src in sources) {
      images[src] = new Image();
      images[src].onload = function () {
        if (++loadedImages >= numImages) {
          callback(images);
        }
      };
      images[src].src = sources[src];
    }
  }
//--------------------BUILD CANVAS AND DRAW----------------------------
  var stage;
  function buildStage(images) {
    stage = new Konva.Stage({
      container: 'container',
      width: width,
      height: height,
      draggable: false,
    });
    var layer = new Konva.Layer();
    var layer2 = new Konva.Layer();
    var layer3 = new Konva.Layer();
    var xray = new Konva.Image({
      image: images.xray,
    });
    var y = images.xray.naturalHeight;
    var x = images.xray.naturalWidth;
    // ------------------- IMAGE ON CENTER ----------------------
    xray.cache();
    xray.offsetX(x/2);
    xray.offsetY(y/2);
    xray.x(stage.width()/2);
    xray.y(stage.height()/2);
    xray.filters([Konva.Filters.Contrast,Konva.Filters.Brighten]);
    layer.add(xray);
    stage.add(layer);
    stage.add(layer2);
    stage.add(layer3);  
    //-------------------BRIGHTNESS------------------------------
    var sliderBrightness = document.getElementById('brightnessControll');
    sliderBrightness.oninput = function (event) {
      if (sliderBrightness.value > 1 || sliderBrightness.value < -1 ){
        return;
      } else {
        xray.brightness(Number(event.target.value));
        layer.batchDraw();
      }
    };
    //------------------------CONTRAST--------------------------------------
    var contrastControll = document.getElementById('contrastControll');
    contrastControll.oninput = function (event) {
      if (contrastControll.value > 100 || contrastControll.value < -100 ){
        return;
      } else {
        xray.contrast(Number(event.target.value));
        layer.batchDraw();
      }
    };
    //---------------------ROTATE----------------------------------
    var rotationControll = document.getElementById('rotationControll');
    rotationControll.oninput = function () {
      if (rotationControll.value > 360 || rotationControll.value < 0 ){
        return;
      } else {
        xray.rotation(Number(rotationControll.value));
        layer.batchDraw();
      }
    };
    //---------------------SCALE-------------------------------------
    var scaleControll = document.getElementById('scaleControll');
    scaleControll.oninput = function () {
      if (scaleControll.value > 3 || scaleControll.value < 0.5 ){
        return;
      } else {
        layer.scale({ 
          x: parseFloat(scaleControll.value), 
          y: parseFloat(scaleControll.value)});
        layer2.scale({
          x: parseFloat(scaleControll.value),
          y: parseFloat(scaleControll.value),
        })
        layer.batchDraw();
        layer2.batchDraw();
      }
    };
    //-----------------------TEXT----------------------
    var complexText = new Konva.Text({
      x: 10,
      y: 10,
      text: data_for_watermark,
      fontSize: 15,
      fontFamily: 'Calibri',
      fill: '#fff',
      padding: 0,
      align: 'left',
    });
    layer3.add(complexText);
    stage.add(layer3);  
    //---------------------MAKE DRAGGABLE-------------------------------------
    $('#btnMove').click(function() {
      if (!$(this).hasClass('activeBtn')) {
        $(this).addClass('activeBtn');
      } else {
        $(this).removeClass('activeBtn');
      }
      layer.draggable(!layer.draggable());
    });
    layer.on('dragmove', function() {
      var pos = layer.position();
      layer2.position({
        x:  pos.x,
        y:  pos.y,
      });
      layer2.draw();
      layer2.batchDraw();
      stage.batchDraw();
      stage.draw()
    });
    //----------------------RULER---------------------------
    $('#btnRuler').click(function() {
      if (!$(this).hasClass('activeBtn')) {
        $(this).addClass('activeBtn');
        if ($('#btnAngle').hasClass('activeBtn')) {
          $('#btnAngle').removeClass('activeBtn');
        }
      } else {
        $(this).removeClass('activeBtn');
      }
    });
    stage.on('click', function () {
      if ($('#btnRuler').hasClass('activeBtn')) {
        var pos = getRelativePointerPosition(layer);
        click++;
        if (click == 1) { // =====CLICK ONE=======
          arrayOfGroups.push(i);
          arrayOfGroups[i] = new Konva.Group({
            draggable: true,
          });
          createCircle(pos);
          x1 = pos.x;
          y1 = pos.y;
        }
        if (click == 2) { // ======CLICK TWO=======
          createCircle(pos);
          x2 = pos.x;
          y2 = pos.y;
          generateLine(x1, x2, y1, y2, i);
          click = 0;
          dx = Math.abs(x2 - x1);
          dy = Math.abs(y2 - y1);
          var L_mm = Math.sqrt( (dx * pixel_spacing_x)**2 + (dy * pixel_spacing_y)**2);
          L_mm = L_mm / $('#scaleControll').val();
          text = new Konva.Text({
            text: L_mm.toFixed(3) + 'mm'
          });
          var label = new Konva.Label({
            x: x2+2,
            y: y2+2,
            opacity:0.9
          });
          label.add(
            new Konva.Tag({
              fill: 'yellow',
            })
          );
          label.add(text);
          arrayOfGroups[i].add(label);
          layer2.add(arrayOfGroups[i]);
          layer2.batchDraw();
          i++;
        }
      }
    });
    layer2.on('mouseover', function (evt){
      var shape = evt.target;
      if (shape){
        document.body.style.cursor = 'grab';
      }
    })
    layer2.on('mouseout', function (evt){
      document.body.style.cursor = 'default';
    })
    //-------------------------------POINTER COORDINATES-------------------
    function getRelativePointerPosition(node) {
      var transform = node.getAbsoluteTransform().copy();
      transform.invert();
      var pos = node.getStage().getPointerPosition();
      pos = transform.point(pos);
      pos.x = pos.x * $('#scaleControll').val() + layer2.x();
      pos.y = pos.y * $('#scaleControll').val() + layer2.y();
      return transform.point(pos);
    }
    //-------------------CREATE LINE----------------------
    function generateLine(x1,x2,y1,y2,i){
      var line = new Konva.Line({
        points: [x1, y1, x2, y2],
        strokeWidth: 3,
        stroke: 'red',
        class: i,
      });
      arrayOfGroups[i].add(line);
      layer2.add(arrayOfGroups[i]);
    }
    //-------------------CREATE CIRCLE----------------------
    function createCircle(pos) {
      var shape = new Konva.Circle({
        x: pos.x,
        y: pos.y,
        fill: 'red',
        radius: 4,
        class: i,
      });
      arrayOfGroups[i].add(shape);
      layer2.add(arrayOfGroups[i]);
      layer2.batchDraw();
    }
    //-------------------FIND ANGLE----------------------
    function find_angle(x1Angle,x2Angle,x3Angle,y1Angle,y2Angle,y3Angle) {
        let A = {x:x1Angle, y:y1Angle}, B = {x:x2Angle, y:y2Angle}, C = {x:x3Angle, y:y3Angle}
        var AB = Math.sqrt(Math.pow(B.x-A.x,2)+ Math.pow(B.y-A.y,2));
        var BC = Math.sqrt(Math.pow(B.x-C.x,2)+ Math.pow(B.y-C.y,2));
        var AC = Math.sqrt(Math.pow(C.x-A.x,2)+ Math.pow(C.y-A.y,2));
        var angle = ((Math.acos((BC*BC+AB*AB-AC*AC)/(2*BC*AB))) * 57.2958).toFixed(2);

        var complexText = new Konva.Text({
          x: x3Angle + 2,
          y: y3Angle + 2,
          text: angle + '°',
          fontFamily: 'Calibri',
          fill: 'black',
        });
        var labelAngle = new Konva.Label({
          x: x3Angle + 2,
          y: y3Angle,
        });
        labelAngle.add(
          new Konva.Tag({
            fill: 'orange',
          })
        );
        labelAngle.add(complexText);
        arrayOfGroups[i].add(labelAngle);
        layer2.add(arrayOfGroups[i]);
        layer2.batchDraw();
    }
    //-------------------CREATE ANGLE----------------------
    var x1Angle, y1Angle, x2Angle, y2Angle, x3Angle, y3Angle;
    var clicksAngle = 0;
    $('#btnAngle').click(function() {
      if (!$(this).hasClass('activeBtn')) {
        if ($('#btnRuler').hasClass('activeBtn')) {
          $('#btnRuler').removeClass('activeBtn');
        }
        $(this).addClass('activeBtn');
      } else {
        $(this).removeClass('activeBtn');
      }
    });
    stage.on('click', function () {
      if ($('#btnAngle').hasClass('activeBtn')) {
        var pos = getRelativePointerPosition(layer);
        clicksAngle++;
        if (clicksAngle == 1) {
          arrayOfGroups[i] = new Konva.Group({
            draggable: true,
          });
          createCircle(pos);
          x1Angle = pos.x;
          y1Angle = pos.y;
        }
        if (clicksAngle == 2) {
          createCircle(pos);
          x2Angle = pos.x;
          y2Angle = pos.y;
          generateLine(x1Angle, x2Angle, y1Angle, y2Angle, i);
        }
        if (clicksAngle == 3) {
          createCircle(pos);
          x3Angle = pos.x;
          y3Angle = pos.y;
          generateLine(x2Angle, x3Angle, y2Angle, y3Angle, i);
          find_angle(x1Angle,x2Angle,x3Angle,y1Angle,y2Angle,y3Angle);
          i++;
          clicksAngle = 0;
        }
      }
    });
  }
  loadImages(sources, buildStage);
});