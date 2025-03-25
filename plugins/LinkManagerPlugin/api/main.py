import os
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, Depends, Query, Path, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# 导入路由
from .routers import links, tags, auth, search

# 创建FastAPI应用
app = FastAPI(
    title="链接管理API",
    description="链接管理系统的REST API接口",
    version="1.0.0"
)

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 在生产环境中应限制为特定域名
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 加载路由
app.include_router(links.router, prefix="/api/links", tags=["links"])
app.include_router(tags.router, prefix="/api/tags", tags=["tags"])
app.include_router(search.router, prefix="/api/search", tags=["search"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

# 自定义异常处理
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail},
    )

# 默认异常处理
@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"message": f"发生未知错误: {str(exc)}"},
    )

# 根路径响应
@app.get("/")
async def root():
    return {"message": "欢迎使用链接管理API", "version": "1.0.0"}

# 健康检查
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# 添加API文档描述
@app.get("/api/docs", include_in_schema=False)
async def get_api_docs():
    return {
        "openapi_url": "/openapi.json",
        "docs_url": "/docs",
        "redoc_url": "/redoc"
    }
