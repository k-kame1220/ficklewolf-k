package com.ficklewolf.k.master.application

import com.ficklewolf.k.master.domain.Master

interface MasterRepository {
    fun load(): Master
}
