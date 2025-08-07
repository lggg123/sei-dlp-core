"""Setup script for SEI DLP AI Engine"""

from setuptools import setup, find_packages

with open("requirements.txt", "r", encoding="utf-8") as f:
    requirements = [
        line.strip() for line in f 
        if line.strip() and not line.startswith("#") and not line.startswith("-")
    ]

setup(
    name="sei-dlp-ai",
    version="0.1.0",
    description="AI Engine for SEI Dynamic Liquidity Protocol",
    long_description=open("README.md", "r", encoding="utf-8").read() if open("README.md").readable() else "",
    long_description_content_type="text/markdown",
    author="SEI DLP Team",
    author_email="team@seidlp.com",
    url="https://github.com/your-org/sei-dlp-core",
    packages=find_packages(),
    install_requires=requirements,
    python_requires=">=3.9",
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
        "Topic :: Software Development :: Libraries :: Python Modules",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "Topic :: Office/Business :: Financial",
    ],
    keywords="defi, ai, machine-learning, sei, blockchain, liquidity",
    project_urls={
        "Bug Reports": "https://github.com/your-org/sei-dlp-core/issues",
        "Source": "https://github.com/your-org/sei-dlp-core/tree/main/ai-engine",
    },
)