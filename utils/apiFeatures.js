class APIFeatures {
  constructor(query, queryString, aliasQuery = null) {
    this.query = query; // mongoose query (Tour.find())
    // queryParams = aliasQuery (если был задан в middleware) или обычный query
    this.queryParams = aliasQuery ?? queryString;
    this.filterObj = {}; // для сохранения фильтра
  }

  filter() {
    // --- ПРЕДОБРАБОТКА ЗАПРОСА (фильтры) --- //
    let queryObj = { ...this.queryParams };

    // Исключаем служебные поля, которые не относятся к фильтрации
    const excludedFields = ['page', 'sort', 'limit', 'fields'];
    excludedFields.forEach(el => delete queryObj[el]);

    // Преобразуем gte, gt, lte, lt → $gte, $gt, $lte, $lt
    const queryStr = JSON.stringify(queryObj).replace(
      /\b(gte|gt|lte|lt)\b/g,
      match => `$${match}`
    );

    // Преобразуем JSON в объект
    this.filterObj = JSON.parse(queryStr); // сохранить применённый фильтр

    // Базовый запрос
    this.query = this.query.find(this.filterObj);

    return this; // чейнинг
  }

  // --- СОРТИРОВКА --- //
  sort() {
    if (this.queryParams.sort) {
      const sortBy = this.queryParams.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      this.query = this.query.sort('-createdAt');
    }

    return this; // чейнинг
  }

  // --- ОГРАНИЧЕНИЕ ПОЛЕЙ --- //
  limitFields() {
    if (this.queryParams.fields) {
      const fields = this.queryParams.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      this.query = this.query.select('-__v');
    }

    return this; // чейнинг
  }

  // --- ПАГИНАЦИЯ --- //
  paginate() {
    this.page = this.queryParams.page * 1 || 1;
    this.limit = this.queryParams.limit * 1 || 10;
    this.skip = (this.page - 1) * this.limit;

    this.query = this.query.skip(this.skip).limit(this.limit);

    return this; // чейнинг
  }

  // --- ПРОВЕРКА СТРАНИЦЫ --- //
  async validatePage(model) {
    if (this.queryParams.page) {
      const numDocs = await model.countDocuments(this.filterObj || {});
      if (this.skip >= numDocs) {
        throw new Error('This page does not exist');
      }
    }

    return this; // чейнинг
  }
}

module.exports = APIFeatures;
