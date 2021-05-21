
  function addToCart(prodId) {
    $.ajax({
      url: '/add-to-cart/' + prodId,
      method: 'get',
      success: (response) => {
          if(response.status){
              let count = $("#cart-count").html()
              count = parseInt(count)+1
              $("#cart-count").html(count)
          }else{
            alert('Please LOG IN to Add products to cart')
          }
        
      }
    })
  }

  function changeQuantity(cartId,prodId,count,userId){
    let quantity = parseInt(document.getElementById(prodId).value)
    count_ = parseInt(count)
      $.ajax({
      url:'/change-product-quantity',
      data:{
          cart:cartId,
          product:prodId,
          count:count_,
          quantity:quantity,
          user:userId,
      },
      method:'post',
      success:(response)=>{
          // console.log(response)
          if(response.removeProduct){
              location.reload()
              alert('Product removed from cart');
              
              
          }else if(response){
            console.log(response)
              document.getElementById(prodId).value = quantity+count
              cartTotal = response.cartTotal;
              document.getElementById('total').innerHTML= cartTotal
              
          }
      }
    

  })
}

function removeItem(cartId,prodId){
  $.ajax({
    url:'/remove-product',
    data:{
      cart:cartId,
      product:prodId,
    },
    method:'post',
    success:(response)=>{
      if(response){
        location.reload()
        // alert('Product has been removed')
      }
    }
  })
}



  

  


        
            
       

