import QR from "../../utils/wxqrcode.js" // 二维码生成器

Page({
    data: {
        // qrcode
        text: 'http://weixin.qq.com/r/JD-_5qPEov7dreeF92o2',
        qrcode: ''        
    },
    onLoad: function() {
        var that = this;
        let qrcodeSize = that.getQRCodeSize()
        that.createQRCode(that.data.text,qrcodeSize)
    },

    //适配不同屏幕大小的canvas
    getQRCodeSize:function(){
        var size={};
        try {
            var res = wx.getSystemInfoSync();
            var scale = 750/278; //不同屏幕下QRcode的适配比例；设计稿是750宽
            var width = res.windowWidth/scale;
            var height = width;//QRcode为正方形
            size.w = width;
            size.h = height;
        } catch (e) {
            // Do something when catch error
            // console.log("获取设备信息失败"+e);
        } 
        return size;
    } ,
    createQRCode:function(text,size){
        //调用插件中的draw方法，绘制二维码图片
       
        let that = this

        // console.log('QRcode: ', text, size)
        let _img = QR.createQrCodeImg(text,{
            size: parseInt(size)
        })    
        
        that.setData({
            'qrcode': _img
        })
    },
})
