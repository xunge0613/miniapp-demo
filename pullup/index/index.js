/**
 * Created by folgerfan on 2017/8/3.
 */
var slideBgColors = 'gray,blueviolet,blue,rebeccapurple,yellowgreen,gold,darkslategray,brown,darkslategray'.split(',');
var slideBgColors2 = 'gray,blueviolet,blues,brown,darkslategray'.split(',').reverse();
var deceleration = 0.005; //阻尼系数,越小越快
function momentum(current, start, time, lowerMargin, wrapperSize) {
  var distance = current - start,
    speed = Math.abs(distance) / time,
    destination,
    duration;
  destination = current + speed / deceleration * (distance < 0 ? -1 : 1);
  duration = speed / deceleration;

  if (destination < lowerMargin) {
    destination = wrapperSize ? lowerMargin - (wrapperSize / 2.5 * (speed / 8)) : lowerMargin;
    distance = Math.abs(destination - current);
    duration = distance / speed;
  } else if (destination > 0) {
    destination = wrapperSize ? wrapperSize / 2.5 * (speed / 8) : 0;
    distance = Math.abs(current) + destination;
    duration = distance / speed;
  }
  return {
    destination: Math.round(destination),
    duration: duration
  };
}

function getTime() {
  return +new Date()
}
var bounceTime = 500,
  sysInfo = wx.getSystemInfoSync();
var windowHeight = sysInfo.windowHeight;

// console.log(windowHeight)
Page({
  data: {
    slideBgColors,
    slideBgColors2,
    distY: 0,
    duration: 0,
    scrollHeight: 100000,
    scrollHeight2: 100000,
    // 上层与下层切换
    showState: {
      upper: 'visible',
      lower: 'hidden',
    },    
  },
  minPullDistance: 70, // 最少拉动距离
  isPulling: false, // 当前是否正在拉..
  y: 0,
  maxScrollY: 0,
  maxScrollY1: 0, // 上层
  maxScrollY2: 0, // 下层
  wrapperHeight: windowHeight,
  maxPullupHeight: 0,

  pullUpAction(direction) {  
    // 下拉成功回调
    // 重置滚动状态
    this.isPulling = false;    
    if(direction === "up") {      
      console.log(this.maxPullupHeight)
      this.y = this.maxPullupHeight;
      this.setData({
        showState: {
          upper: 'visible',
          lower: 'hidden',
        },
        distY: this.maxPullupHeight,      
      })
    } else {
      this.y = 0;
      this.setData({
        showState: {
          upper: 'hidden',
          lower: 'visible',
        },
        distY: 0,  
        duration: 0,             
      })
    }
  },

  _start(e) {
    var point = e.touches[0];
    this.moved = false;
    this.distY = 0;

    this.startTime = getTime();
    this.lastMoveTime = getTime();
    this.startY = this.y;
    this.absStartY = this.y;
    this.pointY = point.pageY;
    /// console.log(this.startY,this.absStartY)
  },
  _move(e) {
    var point = e.touches[0],
      deltaY = point.pageY - this.pointY,
      timestamp = +new Date(),
      newY, absDistY;
    this.pointY = point.pageY;
    this.distY += deltaY;
    absDistY = Math.abs(this.distY);
    // We need to move at least 10 piyels for the scrolling to initiate
    if (timestamp - this.endTime > 300 && absDistY < 10) {
      return;
    }
    newY = this.y + deltaY;
  
    // Slow down if outside of the boundaries
    if (newY > 0 || newY < this.maxScrollY) {      
      newY = this.y + deltaY / 3;
      // 超出过渡阈值（上拉 or 下拉）
      if(newY > this.minPullDistance || newY + 70 < this.maxScrollY) {
        this.isPulling = true;       
      } else {
        this.isPulling = false;
      }
    } else {
      this.isPulling = false;
    }
    this.directionY = deltaY > 0 ? -1 : deltaY < 0 ? 1 : 0;
    this.moved = true;
    this._translate(newY);
    if (timestamp - this.startTime > 300) {
      this.startTime = timestamp;
      this.startY = this.y;
      this.startY = this.y;
    }
  },
  _end(e) {
    var momentumY,
      duration = getTime() - this.startTime,
      newY = Math.round(this.y),
      time = 0,
      that = this;
    this.endTime = getTime();
    // console.log(newY, this.isPulling)
    // 若结束滑动时处于过渡状态，判断方向，切换屏幕
    if (this.isPulling) {
      // console.log(newY)
      this.isPulling = false;  
      if(newY < 0) {
        if (this.data.showState.upper == 'block') {
          this.pullUpAction("down")
          return;
        }        
      } else {
        if (this.data.showState.lower == 'block') {
          this.pullUpAction("up")
          return;
        }        
      }
    }
    if (!this.moved) {
      return;
    }
    if (this.resetPosition(bounceTime)) {
      return;
    } 

    // start momentum animation if needed
    if (duration < 300 && Math.abs(this.startY - this.y) > 10) {
      momentumY = momentum(this.y, this.startY, duration, this.maxScrollY, this.wrapperHeight);
      newY = momentumY.destination;
      time = momentumY.duration;
      this._translate(newY, time);
      setTimeout(function() {
        that.resetPosition(bounceTime)
      }, time)
    }
  },
  _translate: function(y, time) {
    y = Math.round(y);
    this.setData({
      distY: y,
      duration: time || 0
    });
    this.y = y;
  },
  resetPosition: function(time) {
    var y = this.y,
      time = time || 0;
    if (this.y > 0) {
      y = 0;
    } else if (this.y < this.maxScrollY) {
      y = this.maxScrollY;
    }
    if (y == this.y) {
      return false;
    }
    this._translate(y, time);
    return true;
  },
  onReady() {
    var sum = 0,
      that = this;

    wx.createSelectorQuery().selectAll('.slide').boundingClientRect(function(rects) {
      //计算scroller高度和可滚动距离
      rects.forEach(rect => sum += rect.height);
      that.maxScrollY1 = that.wrapperHeight - sum;
      that.maxScrollY = that.maxScrollY1;
      that.setData({
        scrollHeight: sum
      });
      console.log(that.maxScrollY,sum, windowHeight, that.wrapperHeight)
      that.maxPullupHeight = windowHeight - sum; // 从上屏需要滑动多少内容至下屏
    }).exec();

   
 
    wx.createSelectorQuery().selectAll('.scroller2').boundingClientRect(function (rects) {
      //计算scroller高度和可滚动距离
      // sum = 0;
      // rects.forEach(rect => sum += rect.height);
      // that.maxScrollY2 = that.wrapperHeight - sum;
      // that.setData({
      //   scrollHeight2: sum
      // });                    
    }).exec();
  }
});