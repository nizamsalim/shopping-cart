main_list=list()
while True:
    obj = dict()
    name = input('Name of product:')
    if name=="":
        break
    cat = input('Category:')
    price = int(input('Price:'))
    
    obj['name'] = name
    obj['category'] = cat
    obj['price'] = price
    main_list.append(obj)
    print('-----------------------------------------')
print(main_list)
