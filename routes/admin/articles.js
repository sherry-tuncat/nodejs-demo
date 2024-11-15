const express = require('express');
const router = express.Router();
const {Article} = require('../../models');
const {Op} = require('sequelize');
const {
  success,
  failure
} = require('../../utils/reponse')
const { NotFoundError } = require('../../utils/errors')

/**
 * 查询文章列表
 * GET /admin/articles
 * */
router.get('/', async function(req, res) {
  try {
    // 获取查询参数
    const query = req.query;
    // 分页查询
    const currentPage = Number(query.currentPage) || 1;
    const pageSize = Number(query.pageSize) || 10;
    const offset = (currentPage-1) * pageSize;
    // 倒序排列，一般默认倒叙展示最新内容
    const condition = {
      order:[['id','DESC']],
      offset,
      limit:pageSize,
      where:{}
    }
    // 是否查询软删除数据(这里只选择软删除的数据)
    if(query.deleted==='true') {
      condition.paranoid = false;
      condition.where.deletedAt = {
        [Op.not]:null
      }
    }
    // 模糊搜索
    if(query.title) {
      condition.where.title ={
        [Op.like]:`%${query.title}%`
      }
    }
    const {count,rows} = await Article.findAndCountAll(condition);
    const data = {
      articles:rows,
      pagination:{
        total:count,
        currentPage,
        pageSize
      }
    }
    success(res,'查询成功',data);
  } catch (error) {
    failure(error,res)
  }
});

/**
 * 查询一个或多个文章详情
 * POST /admin/articles/getArticles
 * */
router.post('/getArticles',async function(req,res) {
  try {
    // 根据id查询文章
    const articles = await Article.findAll({
      where:{
        id:req.body.id
      }
    });
    success(res,'查询成功',articles);
    success(res,'查询成功');
  } catch(error) {
    failure(error,res)
  }
})

/**
 * 创建文章
 * POST /admin/articles
 */
router.post('/',async function(req,res){
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 插入数据
    const article = await Article.create(body)
    // 201状态码表示成功并且创建了新资源
    success(res,'创建文章成功',article,201);
  } catch(error) {
    failure(error,res)
  }
})

/**
 * 删除文章
 * DELETE /api/articles/:id
 */
router.delete('/:id',async function(req,res){
  try {
    // 获取文章
    const article = await getArticle(req)
    await article.destroy()
    success(res,'删除文章成功',article);
  } catch(error) {
    failure(error,res)
  }
})

/**
 * 恢复文章
 * POST /admin/articles/restore
 */
router.post('/restore',async function(req,res){
  try {
    const {id} = req.body;
    await Article.restore({
      where:{id}
    })
    success(res,'恢复成功')
  } catch(error) {
    failure(error,res)
  }
})

/**
 * 彻底删除文章
 * POST /admin/articles/destroy
 */
router.post('/destroy',async function(req,res){
  try {
    const {id} = req.body;
    await Article.destroy({
      where:{id},
      force:true
    })
    success(res,'彻底删除成功')
  } catch(error) {
    failure(error,res)
  }
})

/**
 * 更新文章
 * PUT /api/articles/:id
 */
router.put('/:id',async function(req,res){
  try {
    // 白名单过滤
    const body = filterBody(req);
    // 获取文章
    const article = await getArticle(req)
    await article.update(body);
    success(res,'更新文章成功',article);
  } catch(error) {
    failure(error,res)
  }
})

/**
 * 公共方法：白名单过滤
 */
function filterBody(req) {
  return {
    title:req.body.title,
    context:req.body.context
  }
}

/**
 * 公共方法：获取文章
 */
async function getArticle(req) {
  const {id} = req.params;
  if(!id) {
    throw new NotFoundError(`id不能为空`)
  }
  const article = await Article.findByPk(id);
  if(!article) {
    throw new NotFoundError(`ID:${id}的文章未找到`)
  }
  return article
}

module.exports = router;
