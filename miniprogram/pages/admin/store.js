const regeneratorRuntime = require('../../utils/runtime')
const util = require('../../utils/util')
const db = wx.cloud.database(); // 初始化数据库
const _ = db.command
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: app.globalData.userInfo,
    admin: {},
    show: false,
    ndata: [],
    dialogshow:false,
    editdata: {},
    Svalue: '',
    images: [], // 上传的图片
    tname: app.globalData.tname
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getuserInfo()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
* 用户点击右上角分享
*/
  onShareAppMessage: function () {
    return {
      title: app.globalData.title,
      desc: app.globalData.desc,
      path: `${app.globalData.url}?sharecode=${this.data.userInfo.mysharecode}`,
      imageUrl: app.globalData.logo
    }
  },

  /**
    * 导航跳转
    */
  navbtn(event) {
    console.log(event)
    wx.redirectTo({
      url: `/pages/${event.detail}`
    })
  },

  /**
  * 获取时间
  */
  getworkday() {
    wx.cloud.callFunction({
      name: 'getDate',
      data: {
        type: '3'
      }
    }).then(res => {
      let temp = res.result.time
      let two = temp + 1000 * 60 * 60 * 24
      this.setData({
        today: util.formatTime(temp),
        tomorrow: util.formatTime(two)
      })

      // console.log(this.data.workday)
      // wx.hideLoading()
    }).catch(err => {
      console.error(err)
      // wx.hideLoading()
    })
  },
  /**
   * 获取用户信息
   **/
  async getuserInfo() {
    const res = await wx.cloud.callFunction({
      name: 'user-login-register',
      data: {
        type: 'info'
      }
    })

    this.setData({
      userInfo: res.result.data
    }, async () => {

      app.globalData.userInfo = res.result.data
      let openid = this.data.userInfo._openid
      const res1 = await wx.cloud.callFunction({
        name: 'getData',
        data: {
          name: 'admin',
          value: {
            openid
          }
        }
      })
      app.globalData.admin = res1.result.data[0]

      this.setData({
        admin: res1.result.data[0]
      }, async () => {
        this.getData()
      })

    })

  },
  /**
  * 获取用户订单信息
  **/
  async  getData() {

    let tvalue = { state: 1}
    if (this.data.Svalue != '') {
      if (this.data.Svalue > 0) {
        tvalue = {
          state: 1,
          phone: {
            $regex: '.*' + this.data.Svalue,
            $options: 'i'
          }
        }
      } else {
        tvalue = {
          state: 1,
          name: {
            $regex: '.*' + this.data.Svalue,
            $options: 'i'
          }
        }
      }
    }

    const res = await wx.cloud.callFunction({
      name: 'getData',
      data: {
        name: 'store',
        value: tvalue
      }
    })
    console.log(res)
    this.setData({
      ndata: res.result.data
    }, async () => {

    })
  },
  showPopup(event) {
    console.log(event)
    let images = event.currentTarget.dataset.images
    let editdata = event.currentTarget.dataset
    this.setData({ show: true, editdata, images })
  },

  onClose() {
    this.setData({ show: false });
  }, 
  
  dialogClose() {
    this.setData({ dialogshow: false });
  },

/*
滑动显示删除按钮
*/
  swipeClose(event) {
    const { position, instance } = event.detail
    switch (position) {
      case 'cell':
        instance.close()
        break
      case 'right':
        this.setData({
          dialogshow:true
        })
        break
    }
  },
/**
 * 获取地址位置
 * */
  chooseLocation() {
    let that = this
    wx.chooseLocation({
      success(res) {
        console.log(res)
        let s = that.data.editdata
        s.address = res.address
        s.position = [res.longitude, res.latitude]
        that.setData({
          // hasLocation: true,
          editdata:s
        })
      },
      fail: function () {
        wx.getSetting({
          success: function (res) {
            var statu = res.authSetting;
            if (!statu['scope.userLocation']) {
              wx.showModal({
                title: '是否授权当前位置',
                content: '需要获取您的地理位置，请确认授权，否则地图功能将无法使用',
                success: function (tip) {
                  if (tip.confirm) {
                    wx.openSetting({
                      success: function (data) {
                        if (data.authSetting["scope.userLocation"] === true) {
                          wx.showToast({
                            title: '授权成功',
                            icon: 'success',
                            duration: 1000
                          })
                          //授权成功之后，再调用chooseLocation选择地方
                          wx.chooseLocation({
                            success: function (res) {
                              let s = that.data.editdata
                              s.address = res.address
                              s.position = [res.longitude, res.latitude]
                              that.setData({
                                // hasLocation: true,
                                editdata: s
                              })
                            },
                          })
                        } else {
                          wx.showToast({
                            title: '授权失败',
                            icon: 'success',
                            duration: 1000
                          })
                        }
                      }
                    })
                  }
                }
              })
            }
          },
          fail: function (res) {
            wx.showToast({
              title: '调用授权窗口失败',
              icon: 'success',
              duration: 1000
            })
          }
        })
      }
    })
  },

  /**
   * 图片选择后的方法
   */
  afterRead(event) {
    const { file } = event.detail
    console.log(event)
    let imgs = []
    file.forEach((val, index, val_arr) => {
      imgs.push({ name: 'image' + index, isImage: true, url: file[index].path })
    })
    // 当设置 mutiple 为 true 时, file 为数组格式，否则为对象格式

    wx.showLoading({
      title: '上传图片',
    })

    // 上传图片到云存储
    let promiseArr = [];
    for (let i = 0; i < imgs.length; i++) {
      promiseArr.push(new Promise((reslove, reject) => {
        let item = imgs[i].url
        let suffix = /\.\w+$/.exec(item)[0] // 正则表达式，返回文件扩展名
        wx.cloud.uploadFile({
          cloudPath: new Date().getTime() + suffix, // 上传至云端的路径
          filePath: item, // 小程序临时文件路径
          success: res => {
            // 返回文件 ID
            console.log(res)
            console.log(res.fileID)
            imgs[i].url = res.fileID
            reslove()
          },
          fail: console.error
        })
      }))
    }

    Promise.all(promiseArr).then(res => {
      // 插入数据
      let s = this.data.editdata
      let images = this.data.images
      imgs.forEach((val, index, val_arr) => {
        images.push({ name: imgs[index].name, isImage: true, url: imgs[index].url })
      })
      s.images = images
      console.log('s.images=' + this.data.images)
      this.setData({
        images,
        editdata: s
      }, () => {
        wx.hideLoading()
      })

    })
  },
  /**
   * 删除图片
   */
  delImg: function (event) {
    let { index } = event.detail
    let images = this.data.images
    let s = this.data.editdata
    images.splice(index, 1)
    s.images = images
    this.setData({
      images,
      editdata: s
    })
  },

  /**
     * 修改版本号
     */
  onChange1({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(1, detail)
  },
  onChange2({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(2, detail)
  },
  onChange3({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(3, detail)
  },
  onChange4({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(4, detail)
  },
  onChange5({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(5, detail)
  },
  onChange6({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(6, detail)
  },
  onChange7({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(7, detail)
  },
  onChange8({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(8, detail)
  },
  onChange9({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(9, detail)
  },
  onChange10({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(10, detail)
  },
  onChange11({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(11, detail)
  },
  onChange12({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(12, detail)
  },
  onChange13({ detail }) {
    // 需要手动对 checked 状态进行更新
    this.onChangeData(13, detail)
  },
  /**
     * 修改数据
     */
  onChangeData(num, detail) {
    let s = this.data.editdata
    if (num == 1) {
      s.name = detail
    } else if (num == 2) {
      s.phone = detail
    } else if (num == 3) {
      s.grade = detail
    } else if (num == 4) {
      s.province = detail
    } else if (num == 5) {
      s.city = detail
    } else if (num == 6) {
      s.county = detail
    } else if (num == 7) {
      s.district = detail
    } else if (num == 8) {
      s.bunks = detail
    } else if (num == 9) {
      s.address = detail
    } else if (num == 10) {
      s.owner = detail
    } else if (num == 11) {
      s.images = detail
    } else if (num == 12) {
      s.state = detail
    }

    this.setData({ editdata: s });
  },


  onSearch() {
    this.getData()
  },
  onCancel() {
    this.setData({ Svalue: '' });
    this.getData()
  },
  /**
     * 修改搜索的值
     */
  onChangeSearch(e) {
    this.setData({
      Svalue: e.detail
    });
  },
  /***
   * 保存版本数据
  **/
  async saveinfo() {
    let s = this.data.editdata
    if (s.name == undefined) {
      wx.showToast({
        title: '请输入店名',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.phone == undefined) {
      wx.showToast({
        title: '请输入联系电话',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.grade == undefined) {
      wx.showToast({
        title: '请输入级别',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.bunks == undefined) {
      wx.showToast({
        title: '请输入床位数',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.owner == undefined) {
      wx.showToast({
        title: '请输入营业时间',
        icon: 'error',
        duration: 2000
      })
      return
    }else if (s.province == undefined) {
      wx.showToast({
        title: '请输入省份',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.city == undefined) {
      wx.showToast({
        title: '请输入市',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.district == undefined) {
      wx.showToast({
        title: '请输入区',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.county == undefined) {
      wx.showToast({
        title: '请输入县',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.address == undefined) {
      wx.showToast({
        title: '请输入地址',
        icon: 'error',
        duration: 2000
      })
      return
    } else if (s.images == undefined) {
      wx.showToast({
        title: '请上传图片',
        icon: 'error',
        duration: 2000
      })
      return
    }
    let data = {
      sid: s.sid,
      id: s.id,
      name: s.name,
      phone: s.phone,
      address: s.address,
      position: s.position,
      grade: s.grade,
      bunks: s.bunks,
      owner: s.owner,
      province: s.province,
      city: s.city,
      district: s.district,
      county: s.county,
      images: s.images
    }
    let type = 'editstore'
    if(data.sid==undefined){
      type = 'addstore'
    }
    const { result } = await wx.cloud.callFunction({
      name: 'addData',
      data: {
        type,
        data
      }
    })

    console.log(result)

    if (result.code == 0) {
      wx.showToast({
        title: result.message,
        icon: 'success',
        duration: 2000
      })
      this.setData({
        show: false
      }, () => {
        this.getData()
      })
    } else {
      wx.showToast({
        title: '网络不稳定,请稍后再试',
        icon: 'error',
        duration: 2000
      })
    }

  },
  /***
   * 删除数据
  **/
  async delinfo() {
    let s = this.data.editdata
    
    let data = {
      sid: s.sid,
      id: s.id
    }
    let type = 'delstore'
    const { result } = await wx.cloud.callFunction({
      name: 'addData',
      data: {
        type,
        data
      }
    })

    console.log(result)

    if (result.code == 0) {
      wx.showToast({
        title: result.message,
        icon: 'success',
        duration: 2000
      })
      this.setData({
        show: false
      }, () => {
        this.getData()
      })
    } else {
      wx.showToast({
        title: '网络不稳定,请稍后再试',
        icon: 'error',
        duration: 2000
      })
    }

  }
})